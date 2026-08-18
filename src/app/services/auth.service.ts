import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { tap } from 'rxjs';

export type AuthenticatedCompany = {
  public_id: string;
  name: string;
};

export type DashboardCompany = AuthenticatedCompany;
export type AuthRole = 'company' | 'superuser';

type CompanyAuthResponse = {
  ok: true;
  role: 'company';
  company: AuthenticatedCompany;
};

type SuperuserAuthResponse = {
  ok: true;
  role: 'superuser';
  companies: DashboardCompany[];
};

type AuthResponse = CompanyAuthResponse | SuperuserAuthResponse;

export type CreateCompanyAccountPayload = {
  companyName: string;
  accountName: string;
  email: string | null;
  accessCode: string;
};

type CreateCompanyAccountResponse = {
  ok: true;
  company: DashboardCompany;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly company = signal<AuthenticatedCompany | null>(null);
  readonly companies = signal<DashboardCompany[]>([]);
  readonly role = signal<AuthRole | null>(null);

  login(accessCode: string) {
    return this.http
      .post<AuthResponse>(
        this.authEndpoint('/auth/login'),
        { accessCode },
        {
          withCredentials: true,
        },
      )
      .pipe(tap((response) => this.applyAuthResponse(response)));
  }

  me() {
    return this.http
      .get<AuthResponse>(this.authEndpoint('/auth/me'), {
        withCredentials: true,
      })
      .pipe(tap((response) => this.applyAuthResponse(response)));
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
      .pipe(tap(() => this.clearSession()));
  }

  createCompanyAccount(payload: CreateCompanyAccountPayload) {
    return this.http
      .post<CreateCompanyAccountResponse>(this.authEndpoint('/superuser/companies'), payload, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.companies.update((companies) =>
            [...companies, response.company].sort((left, right) => left.name.localeCompare(right.name, 'es-ES')),
          );
        }),
      );
  }

  private applyAuthResponse(response: AuthResponse): void {
    this.role.set(response.role);

    if (response.role === 'company') {
      this.company.set(response.company);
      this.companies.set([]);
      return;
    }

    this.company.set(null);
    this.companies.set(response.companies);
  }

  private clearSession(): void {
    this.role.set(null);
    this.company.set(null);
    this.companies.set([]);
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
