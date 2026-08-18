import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { tap } from 'rxjs';

export type AuthenticatedCompany = {
  public_id: string;
  name: string;
};

type AuthResponse = {
  ok: true;
  company: AuthenticatedCompany;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly company = signal<AuthenticatedCompany | null>(null);

  login(accessCode: string) {
    return this.http
      .post<AuthResponse>(
        this.authEndpoint('/auth/login'),
        { accessCode },
        {
          withCredentials: true,
        },
      )
      .pipe(tap((response) => this.company.set(response.company)));
  }

  me() {
    return this.http
      .get<AuthResponse>(this.authEndpoint('/auth/me'), {
        withCredentials: true,
      })
      .pipe(tap((response) => this.company.set(response.company)));
  }

  logout() {
    return this.http
      .post<{ ok: true }>(
        this.authEndpoint('/auth/logout'),
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(tap(() => this.company.set(null)));
  }

  private authEndpoint(path: string): string {
    if (isPlatformBrowser(this.platformId)) {
      const hostname = globalThis.location?.hostname;

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://localhost:8787${path}`;
      }
    }

    return `https://api.ludusales.com${path}`;
  }
}
