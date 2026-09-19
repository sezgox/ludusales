import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Gamification, GamificationDetail, GamificationPayload, Prize, PrizePayload, RankingPayload, RankingReplacementEntry } from '../models/gamification';
import { ApiUrlService } from './api-url.service';

type OkResponse = { ok: true };

@Injectable({ providedIn: 'root' })
export class GamificationApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly credentials = { withCredentials: true } as const;

  list(companyPublicId: string) {
    return this.http.get<{ ok: true; gamifications: Gamification[] }>(
      this.endpoint(`/companies/${encodeURIComponent(companyPublicId)}/gamifications`),
      this.credentials,
    ).pipe(map((response) => ({ ...response, gamifications: response.gamifications.map((gamification) => this.withEffectiveStatus(gamification)) })));
  }

  detail(companyPublicId: string, gamificationPublicId: string) {
    return this.http.get<{ ok: true; gamification: GamificationDetail }>(
      this.endpoint(
        `/companies/${encodeURIComponent(companyPublicId)}/gamifications/${encodeURIComponent(gamificationPublicId)}`,
      ),
      this.credentials,
    ).pipe(map((response) => ({ ...response, gamification: this.withEffectiveStatus(response.gamification) })));
  }

  create(companyPublicId: string, payload: GamificationPayload) {
    return this.http.post<{ ok: true; gamification: Gamification }>(
      this.endpoint(`/superuser/companies/${encodeURIComponent(companyPublicId)}/gamifications`),
      payload,
      this.credentials,
    );
  }

  update(gamificationPublicId: string, payload: Partial<GamificationPayload>) {
    return this.http.patch<{ ok: true; gamification: Gamification }>(
      this.endpoint(`/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}`),
      payload,
      this.credentials,
    );
  }

  activate(gamificationPublicId: string) {
    return this.http.post<{ ok: true; gamification: Gamification }>(
      this.endpoint(`/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}/activate`),
      {},
      this.credentials,
    );
  }

  activateWithEndDate(gamificationPublicId: string, endAt: string) {
    return this.http.post<{ ok: true; gamification: Gamification }>(
      this.endpoint(`/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}/activate`),
      { endAt },
      this.credentials,
    );
  }

  deactivate(gamificationPublicId: string) {
    return this.http.post<{ ok: true; gamification: Gamification }>(
      this.endpoint(`/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}/deactivate`),
      {},
      this.credentials,
    );
  }

  deleteGamification(gamificationPublicId: string) {
    return this.http.delete<OkResponse>(
      this.endpoint(`/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}`),
      this.credentials,
    );
  }

  uploadCover(gamificationPublicId: string, image: Blob) {
    return this.putWebp<{ ok: true; imageUrl: string }>(
      `/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}/image`,
      image,
    );
  }

  deleteCover(gamificationPublicId: string) {
    return this.http.delete<OkResponse>(
      this.endpoint(`/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}/image`),
      this.credentials,
    );
  }

  createPrize(gamificationPublicId: string, payload: PrizePayload) {
    return this.http.post<{ ok: true; prize: Prize }>(
      this.endpoint(`/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}/prizes`),
      payload,
      this.credentials,
    );
  }

  updatePrize(prizePublicId: string, payload: PrizePayload) {
    return this.http.patch<{ ok: true; prize: Prize }>(
      this.endpoint(`/superuser/prizes/${encodeURIComponent(prizePublicId)}`),
      payload,
      this.credentials,
    );
  }

  deletePrize(prizePublicId: string) {
    return this.http.delete<OkResponse>(
      this.endpoint(`/superuser/prizes/${encodeURIComponent(prizePublicId)}`),
      this.credentials,
    );
  }

  uploadPrizePicture(prizePublicId: string, image: Blob) {
    return this.putWebp<{ ok: true; pictureUrl: string }>(
      `/superuser/prizes/${encodeURIComponent(prizePublicId)}/picture`,
      image,
    );
  }

  deletePrizePicture(prizePublicId: string) {
    return this.http.delete<OkResponse>(
      this.endpoint(`/superuser/prizes/${encodeURIComponent(prizePublicId)}/picture`),
      this.credentials,
    );
  }

  replaceRanking(gamificationPublicId: string, entries: RankingReplacementEntry[], fieldHeaders?: string[]) {
    return this.http.put<{ ok: true; count: number }>(
      this.endpoint(`/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}/ranking`),
      { entries, ...(fieldHeaders ? { fieldHeaders } : {}) },
      this.credentials,
    );
  }

  upsertRankingEntry(gamificationPublicId: string, participantCode: string, payload: RankingPayload) {
    return this.http.put<OkResponse>(
      this.endpoint(
        `/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}/ranking/${encodeURIComponent(participantCode)}`,
      ),
      payload,
      this.credentials,
    );
  }

  deleteRankingEntry(gamificationPublicId: string, participantCode: string) {
    return this.http.delete<OkResponse>(
      this.endpoint(
        `/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}/ranking/${encodeURIComponent(participantCode)}`,
      ),
      this.credentials,
    );
  }

  uploadRankingParticipantPicture(gamificationPublicId: string, participantCode: string, image: Blob) {
    return this.putWebp<{ ok: true; pictureUrl: string }>(
      `/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}/ranking/${encodeURIComponent(participantCode)}/picture`,
      image,
    );
  }

  deleteRankingParticipantPicture(gamificationPublicId: string, participantCode: string) {
    return this.http.delete<OkResponse>(
      this.endpoint(
        `/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}/ranking/${encodeURIComponent(participantCode)}/picture`,
      ),
      this.credentials,
    );
  }

  private putWebp<T>(path: string, image: Blob) {
    return this.http.put<T>(this.endpoint(path), image, {
      withCredentials: true,
      headers: new HttpHeaders({ 'Content-Type': 'image/webp' }),
    });
  }

  private endpoint(path: string): string {
    return this.apiUrl.endpoint(path);
  }

  private withEffectiveStatus<T extends Gamification>(gamification: T): T {
    const isExpired = gamification.status === 'active' && Date.parse(gamification.endAt) <= Date.now();
    return isExpired ? { ...gamification, status: 'inactive' } : gamification;
  }
}
