import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Gamification, GamificationDetail } from '../models/gamification';
import { apiErrorMessage } from './api-error';
import { GamificationApiService } from './gamification-api.service';

type CompanyGamificationCache = {
  gamifications: Gamification[];
  details: ReadonlyMap<string, GamificationDetail>;
};

const detailKey = (companyPublicId: string, gamificationPublicId: string): string =>
  `${companyPublicId}:${gamificationPublicId}`;

@Injectable({ providedIn: 'root' })
export class GamificationStore {
  private readonly api = inject(GamificationApiService);
  private readonly cache = signal<ReadonlyMap<string, CompanyGamificationCache>>(new Map());
  private readonly selectedByCompany = signal<ReadonlyMap<string, string | null>>(new Map());
  private readonly loadingCompanies = signal<ReadonlySet<string>>(new Set());
  private readonly loadingDetails = signal<ReadonlySet<string>>(new Set());
  private readonly feedbackByCompany = signal<ReadonlyMap<string, string | null>>(new Map());
  private readonly listRequests = new Map<string, Promise<void>>();
  private readonly detailRequests = new Map<string, Promise<void>>();
  private generation = 0;

  private readonly selectedCompany = signal<string | null>(null);
  readonly selectedCompanyPublicId = this.selectedCompany.asReadonly();
  readonly selectedGamificationPublicId = computed(() => {
    const companyPublicId = this.selectedCompany();
    return companyPublicId ? (this.selectedByCompany().get(companyPublicId) ?? null) : null;
  });
  readonly gamifications = computed(() => {
    const companyPublicId = this.selectedCompany();
    return companyPublicId ? (this.cache().get(companyPublicId)?.gamifications ?? []) : [];
  });
  readonly selectedGamification = computed(() => {
    const companyPublicId = this.selectedCompany();
    const gamificationPublicId = this.selectedGamificationPublicId();
    return companyPublicId && gamificationPublicId
      ? (this.cache().get(companyPublicId)?.details.get(gamificationPublicId) ?? null)
      : null;
  });
  readonly isLoadingGamifications = computed(() => {
    const companyPublicId = this.selectedCompany();
    return Boolean(companyPublicId && this.loadingCompanies().has(companyPublicId) && !this.hasCompany(companyPublicId));
  });
  readonly isLoadingDetail = computed(() => {
    const companyPublicId = this.selectedCompany();
    const gamificationPublicId = this.selectedGamificationPublicId();
    return Boolean(
      companyPublicId &&
        gamificationPublicId &&
        this.loadingDetails().has(detailKey(companyPublicId, gamificationPublicId)) &&
        !this.hasDetail(companyPublicId, gamificationPublicId),
    );
  });
  readonly feedback = computed(() => {
    const companyPublicId = this.selectedCompany();
    return companyPublicId ? (this.feedbackByCompany().get(companyPublicId) ?? null) : null;
  });

  selectCompany(companyPublicId: string | null): void {
    this.selectedCompany.set(companyPublicId);
  }

  selectGamification(gamificationPublicId: string | null): void {
    const companyPublicId = this.selectedCompany();
    if (!companyPublicId) return;

    this.selectedByCompany.update((selected) => {
      const next = new Map(selected);
      next.set(companyPublicId, gamificationPublicId);
      return next;
    });
  }

  hasCompany(companyPublicId: string): boolean {
    return this.cache().has(companyPublicId);
  }

  hasDetail(companyPublicId: string, gamificationPublicId: string): boolean {
    return this.cache().get(companyPublicId)?.details.has(gamificationPublicId) ?? false;
  }

  ensureCompany(companyPublicId: string, force = false): Promise<void> {
    const pending = this.listRequests.get(companyPublicId);
    if (pending) return pending;
    if (!force && this.hasCompany(companyPublicId)) return Promise.resolve();

    const generation = this.generation;
    this.setLoadingCompany(companyPublicId, true);
    this.setFeedback(companyPublicId, null);

    let request: Promise<void>;
    request = firstValueFrom(this.api.list(companyPublicId))
      .then((response) => {
        if (generation !== this.generation) return;
        this.setCompanyGamifications(companyPublicId, response.gamifications);
      })
      .catch((error: unknown) => {
        if (generation === this.generation) {
          this.setFeedback(companyPublicId, apiErrorMessage(error, 'No se pudieron cargar las gamificaciones.'));
        }
      })
      .finally(() => {
        if (this.listRequests.get(companyPublicId) !== request) return;
        this.listRequests.delete(companyPublicId);
        this.setLoadingCompany(companyPublicId, false);
      });
    this.listRequests.set(companyPublicId, request);
    return request;
  }

  ensureDetail(companyPublicId: string, gamificationPublicId: string, force = false): Promise<void> {
    const key = detailKey(companyPublicId, gamificationPublicId);
    const pending = this.detailRequests.get(key);
    if (pending) return pending;
    if (!force && this.hasDetail(companyPublicId, gamificationPublicId)) return Promise.resolve();

    const generation = this.generation;
    this.setLoadingDetail(key, true);
    this.setFeedback(companyPublicId, null);

    let request: Promise<void>;
    request = firstValueFrom(this.api.detail(companyPublicId, gamificationPublicId))
      .then((response) => {
        if (generation !== this.generation) return;
        this.setDetail(companyPublicId, response.gamification);
      })
      .catch((error: unknown) => {
        if (generation === this.generation) {
          this.setFeedback(
            companyPublicId,
            apiErrorMessage(error, 'No se pudo cargar la gamificación seleccionada.'),
          );
        }
      })
      .finally(() => {
        if (this.detailRequests.get(key) !== request) return;
        this.detailRequests.delete(key);
        this.setLoadingDetail(key, false);
      });
    this.detailRequests.set(key, request);
    return request;
  }

  clear(): void {
    this.generation += 1;
    this.cache.set(new Map());
    this.selectedByCompany.set(new Map());
    this.selectedCompany.set(null);
    this.loadingCompanies.set(new Set());
    this.loadingDetails.set(new Set());
    this.feedbackByCompany.set(new Map());
    this.listRequests.clear();
    this.detailRequests.clear();
  }

  private setCompanyGamifications(companyPublicId: string, gamifications: Gamification[]): void {
    this.cache.update((cache) => {
      const next = new Map(cache);
      const currentDetails = cache.get(companyPublicId)?.details ?? new Map<string, GamificationDetail>();
      const validIds = new Set(gamifications.map((gamification) => gamification.publicId));
      const details = new Map(
        [...currentDetails].filter(([gamificationPublicId]) => validIds.has(gamificationPublicId)),
      );
      next.set(companyPublicId, { gamifications, details });
      return next;
    });
  }

  private setDetail(companyPublicId: string, detail: GamificationDetail): void {
    this.cache.update((cache) => {
      const next = new Map(cache);
      const current = cache.get(companyPublicId) ?? { gamifications: [], details: new Map<string, GamificationDetail>() };
      const details = new Map(current.details);
      details.set(detail.publicId, detail);
      const { prizes: _prizes, ranking: _ranking, ...summary } = detail;
      const gamifications = current.gamifications.map((gamification) =>
        gamification.publicId === detail.publicId ? summary : gamification,
      );
      next.set(companyPublicId, { gamifications, details });
      return next;
    });
  }

  private setLoadingCompany(companyPublicId: string, isLoading: boolean): void {
    this.loadingCompanies.update((loading) => {
      const next = new Set(loading);
      if (isLoading) next.add(companyPublicId);
      else next.delete(companyPublicId);
      return next;
    });
  }

  private setLoadingDetail(key: string, isLoading: boolean): void {
    this.loadingDetails.update((loading) => {
      const next = new Set(loading);
      if (isLoading) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  private setFeedback(companyPublicId: string, feedback: string | null): void {
    this.feedbackByCompany.update((feedbackByCompany) => {
      const next = new Map(feedbackByCompany);
      next.set(companyPublicId, feedback);
      return next;
    });
  }
}
