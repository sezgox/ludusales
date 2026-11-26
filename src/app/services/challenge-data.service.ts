import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { ChallengeHistory, ChallengeMember, ChallengeSettings, MasterInput, MasterPreview, TvDisplay } from '../models/challenge';
import { ApiUrlService } from './api-url.service';

@Injectable({ providedIn: 'root' })
export class ChallengeDataService {
  private readonly http = inject(HttpClient);
  private readonly urls = inject(ApiUrlService);
  private readonly credentials = { withCredentials: true } as const;

  settings(id: string) {
    return this.http.get<{ settings: ChallengeSettings }>(this.path(id, 'challenge-settings'), this.credentials)
      .pipe(map(({ settings }) => settings));
  }

  saveSettings(id: string, settings: ChallengeSettings) {
    return this.http.put<{ settings: ChallengeSettings }>(this.path(id, 'challenge-settings'), settings, this.credentials)
      .pipe(map(({ settings }) => settings));
  }

  members(id: string) {
    return this.http.get<{ members: ChallengeMember[] }>(this.path(id, 'challenge-members'), this.credentials)
      .pipe(map(({ members }) => members));
  }

  saveMember(id: string, member: Omit<ChallengeMember, 'id'>) {
    return this.http.put<{ members: ChallengeMember[] }>(this.path(id, `challenge-members/${encodeURIComponent(member.code)}`), member, this.credentials)
      .pipe(map(({ members }) => members));
  }

  preview(id: string, input: MasterInput) {
    return this.http.post<MasterPreview>(this.path(id, 'master-preview'), { input }, this.credentials);
  }

  publish(id: string, input: MasterInput, previewToken: string, workbook: File) {
    const form = new FormData();
    form.append('payload', JSON.stringify({ input, previewToken }));
    form.append('workbook', workbook);
    return this.http.post<{ publicId: string }>(this.path(id, 'master-publications'), form, this.credentials);
  }

  createTvLink(id: string) { return this.http.post<{ token: string }>(this.path(id, 'tv-link'), {}, this.credentials); }

  revokeTvLink(id: string) { return this.http.delete<{ ok: true }>(this.path(id, 'tv-link'), this.credentials); }

  readTv(token: string) { return this.http.post<TvDisplay>(this.urls.endpoint('/tv/read'), { token }); }

  history(company: string) {
    return this.http.get<ChallengeHistory>(this.urls.endpoint(`/companies/${encodeURIComponent(company)}/history`), this.credentials);
  }

  private path(id: string, suffix: string): string {
    return this.urls.endpoint(`/superuser/gamifications/${encodeURIComponent(id)}/${suffix}`);
  }
}
