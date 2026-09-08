import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import { Gamification, GamificationStatus } from '../../models/gamification';
import { apiErrorMessage } from '../../services/api-error';
import { AuthService } from '../../services/auth.service';
import { GamificationStore } from '../../services/gamification.store';
import { GamificationSection } from './gamification-section/gamification-section';
import { InformationSection } from './information-section/information-section';
import { PrizesSection } from './prizes-section/prizes-section';
import { RankingSection } from './ranking-section/ranking-section';

type DashboardSection = 'informacion' | 'premios' | 'gamificacion' | 'ranking';
type DashboardMenuItem = { label: string; section: DashboardSection };

@Component({
  selector: 'app-dashboard',
  imports: [
    GamificationSection,
    InformationSection,
    NgOptimizedImage,
    PrizesSection,
    RankingSection,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly authService = inject(AuthService);
  private readonly gamificationStore = inject(GamificationStore);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  private readonly routeCompanyPublicId = computed(() => this.companyPublicIdFromUrl(this.currentUrl()));
  private readonly routeGamificationPublicId = computed(() => this.gamificationPublicIdFromUrl(this.currentUrl()));
  readonly companies = this.authService.companies;
  readonly gamifications = this.gamificationStore.gamifications;
  readonly selectedGamificationPublicId = this.gamificationStore.selectedGamificationPublicId;
  readonly selectedGamification = this.gamificationStore.selectedGamification;
  readonly isLoadingGamifications = this.gamificationStore.isLoadingGamifications;
  readonly isLoadingDetail = this.gamificationStore.isLoadingDetail;
  readonly gamificationFeedback = this.gamificationStore.feedback;
  readonly isMenuOpen = signal(false);
  readonly isCreatingCompany = signal(false);
  readonly createCompanyFeedback = signal<string | null>(null);
  readonly isSuperuser = computed(() => this.authService.role() === 'superuser');
  readonly createCompanyForm = this.formBuilder.group({
    companyName: ['', [Validators.required, Validators.maxLength(160)]],
    email: ['', [Validators.email, Validators.maxLength(254)]],
    accessCode: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(80)]],
  });
  readonly selectedCompanyPublicId = computed(() => {
    if (!this.isSuperuser()) {
      return this.authService.company()?.public_id ?? null;
    }

    const companies = this.companies();
    const routeCompanyPublicId = this.routeCompanyPublicId();

    if (routeCompanyPublicId && companies.some((company) => company.public_id === routeCompanyPublicId)) {
      return routeCompanyPublicId;
    }

    return companies.at(0)?.public_id ?? null;
  });
  readonly company = computed(() => {
    if (!this.isSuperuser()) return this.authService.company();
    const selectedCompanyPublicId = this.selectedCompanyPublicId();
    return this.companies().find((company) => company.public_id === selectedCompanyPublicId) ?? null;
  });
  readonly menu: DashboardMenuItem[] = [
    { label: 'Información', section: 'informacion' },
    { label: 'Premios', section: 'premios' },
    { label: 'Gamificación', section: 'gamificacion' },
    { label: 'Live Ranking', section: 'ranking' },
  ];
  readonly activeSection = computed(() => this.sectionFromUrl(this.currentUrl()));
  readonly companyId = computed(() => this.company()?.public_id.slice(0, 8).toUpperCase() ?? 'SIN ID');
  readonly gamificationQuery = computed(() => {
    const publicId = this.selectedGamificationPublicId();
    return publicId ? { gamification: publicId } : {};
  });

  private readonly selectedCompanyUrlEffect = effect(() => {
    if (!this.isSuperuser()) return;
    const selectedCompanyPublicId = this.selectedCompanyPublicId();

    if (!selectedCompanyPublicId || this.routeCompanyPublicId() === selectedCompanyPublicId) return;
    void this.router.navigateByUrl(this.dashboardPath(this.activeSection(), selectedCompanyPublicId), { replaceUrl: true });
  });

  private readonly companyGamificationsEffect = effect(() => {
    const companyPublicId = this.selectedCompanyPublicId();

    if (!companyPublicId) {
      this.gamificationStore.selectCompany(null);
      return;
    }

    this.gamificationStore.selectCompany(companyPublicId);
    void this.gamificationStore.ensureCompany(companyPublicId);
  });

  private readonly routeGamificationEffect = effect(() => {
    const companyPublicId = this.selectedCompanyPublicId();
    const requestedPublicId = this.routeGamificationPublicId();
    const gamifications = this.gamifications();

    if (
      !companyPublicId ||
      this.gamificationStore.selectedCompanyPublicId() !== companyPublicId ||
      !this.gamificationStore.hasCompany(companyPublicId)
    ) {
      return;
    }
    const selectedPublicId = this.resolveSelection(requestedPublicId, gamifications);

    if (this.selectedGamificationPublicId() !== selectedPublicId) {
      this.gamificationStore.selectGamification(selectedPublicId);
    }
    if (selectedPublicId) void this.gamificationStore.ensureDetail(companyPublicId, selectedPublicId);

    if (requestedPublicId !== selectedPublicId) {
      void this.setGamificationQuery(selectedPublicId, true);
    }
  });

  toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  dashboardPath(section: DashboardSection, companyPublicId = this.selectedCompanyPublicId()): string {
    return this.isSuperuser() && companyPublicId ? `/dashboard/${section}/${companyPublicId}` : `/dashboard/${section}`;
  }

  selectCompany(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement) || !event.target.value) return;
    void this.router.navigateByUrl(this.dashboardPath(this.activeSection(), event.target.value));
  }

  selectGamification(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement) || !event.target.value) return;
    void this.setGamificationQuery(event.target.value);
  }

  gamificationLabel(gamification: Gamification): string {
    const status = this.statusLabel(gamification.status);
    const shortTitle = gamification.title.length > 48 ? `${gamification.title.slice(0, 45)}…` : gamification.title;
    return `${status} · ${shortTitle}`;
  }

  openCreateCompanyDialog(dialog: HTMLDialogElement): void {
    this.createCompanyFeedback.set(null);
    if (!dialog.open) dialog.showModal();
  }

  closeCreateCompanyDialog(dialog: HTMLDialogElement): void {
    if (!this.isCreatingCompany() && dialog.open) dialog.close();
  }

  async createCompanyAccount(dialog: HTMLDialogElement): Promise<void> {
    if (this.createCompanyForm.invalid) {
      this.createCompanyForm.markAllAsTouched();
      this.createCompanyFeedback.set('Revisa los campos del formulario.');
      return;
    }

    this.isCreatingCompany.set(true);
    this.createCompanyFeedback.set(null);
    const formValue = this.createCompanyForm.getRawValue();
    const companyName = formValue.companyName.trim();

    try {
      const response = await firstValueFrom(
        this.authService.createCompanyAccount({
          companyName,
          accountName: companyName,
          email: formValue.email.trim() || null,
          accessCode: formValue.accessCode.trim(),
        }),
      );
      this.createCompanyForm.reset();
      dialog.close();
      await this.router.navigateByUrl(this.dashboardPath(this.activeSection(), response.company.public_id));
    } catch (error) {
      this.createCompanyFeedback.set(apiErrorMessage(error, 'No se pudo crear la empresa. Comprueba los datos.'));
    } finally {
      this.isCreatingCompany.set(false);
    }
  }

  async refreshSelectedDetail(): Promise<void> {
    const companyPublicId = this.selectedCompanyPublicId();
    const gamificationPublicId = this.selectedGamificationPublicId();
    if (companyPublicId && gamificationPublicId) {
      await this.gamificationStore.ensureDetail(companyPublicId, gamificationPublicId, true);
    }
  }

  async handleGamificationChanged(preferredPublicId: string | null): Promise<void> {
    const companyPublicId = this.selectedCompanyPublicId();
    if (!companyPublicId) return;

    await this.gamificationStore.ensureCompany(companyPublicId, true);
    const selectedPublicId = this.resolveSelection(preferredPublicId, this.gamifications());
    this.gamificationStore.selectGamification(selectedPublicId);
    await this.setGamificationQuery(selectedPublicId, true);
    if (selectedPublicId) {
      await this.gamificationStore.ensureDetail(
        companyPublicId,
        selectedPublicId,
        preferredPublicId === selectedPublicId,
      );
    }
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.authService.logout());
    await this.router.navigateByUrl('/login');
  }

  private resolveSelection(requestedPublicId: string | null, gamifications: Gamification[]): string | null {
    if (requestedPublicId && gamifications.some((item) => item.publicId === requestedPublicId)) return requestedPublicId;
    return gamifications.find((item) => item.status === 'active')?.publicId ?? gamifications.at(0)?.publicId ?? null;
  }

  private setGamificationQuery(publicId: string | null, replaceUrl = false): Promise<boolean> {
    return this.router.navigate([], {
      queryParams: { gamification: publicId },
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }

  private statusLabel(status: GamificationStatus): string {
    return { draft: 'Borrador', active: 'Activa', closed: 'Cerrada' }[status];
  }

  private sectionFromUrl(url: string): DashboardSection {
    const section = new URL(url, 'https://dashboard.local').pathname.split('/').filter(Boolean).at(1);
    return section === 'informacion' || section === 'premios' || section === 'gamificacion' || section === 'ranking'
      ? section
      : 'informacion';
  }

  private companyPublicIdFromUrl(url: string): string | null {
    return new URL(url, 'https://dashboard.local').pathname.split('/').filter(Boolean).at(2) ?? null;
  }

  private gamificationPublicIdFromUrl(url: string): string | null {
    return new URL(url, 'https://dashboard.local').searchParams.get('gamification');
  }
}
