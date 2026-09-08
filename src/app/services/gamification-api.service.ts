import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Gamification, GamificationDetail, GamificationPayload, Prize, PrizePayload, RankingPayload } from '../models/gamification';
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
    );
  }

  detail(companyPublicId: string, gamificationPublicId: string) {
    return this.http.get<{ ok: true; gamification: GamificationDetail }>(
      this.endpoint(
        `/companies/${encodeURIComponent(companyPublicId)}/gamifications/${encodeURIComponent(gamificationPublicId)}`,
      ),
      this.credentials,
    );
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

  close(gamificationPublicId: string) {
    return this.http.post<{ ok: true; gamification: Gamification }>(
      this.endpoint(`/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}/close`),
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

  upsertRankingEntry(gamificationPublicId: string, externalParticipantId: string, payload: RankingPayload) {
    return this.http.put<OkResponse>(
      this.endpoint(
        `/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}/ranking/${encodeURIComponent(externalParticipantId)}`,
      ),
      payload,
      this.credentials,
    );
  }

  deleteRankingEntry(gamificationPublicId: string, externalParticipantId: string) {
    return this.http.delete<OkResponse>(
      this.endpoint(
        `/superuser/gamifications/${encodeURIComponent(gamificationPublicId)}/ranking/${encodeURIComponent(externalParticipantId)}`,
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
}
