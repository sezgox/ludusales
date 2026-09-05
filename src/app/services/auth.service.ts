import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { ApiUrlService } from './api-url.service';
import { GamificationStore } from './gamification.store';

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
  private readonly apiUrl = inject(ApiUrlService);
  private readonly gamificationStore = inject(GamificationStore);
  private sessionContext: string | null = null;

  readonly company = signal<AuthenticatedCompany | null>(null);
  readonly companies = signal<DashboardCompany[]>([]);
  readonly role = signal<AuthRole | null>(null);

  login(accessCode: string) {
    return this.http
      .post<AuthResponse>(
        this.apiUrl.endpoint('/auth/login'),
        { accessCode },
        {
          withCredentials: true,
        },
      )
      .pipe(
        tap((response) => {
          this.gamificationStore.clear();
          this.sessionContext = null;
          this.applyAuthResponse(response);
        }),
      );
  }

  me() {
    return this.http
      .get<AuthResponse>(this.apiUrl.endpoint('/auth/me'), {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: (response) => this.applyAuthResponse(response),
          error: () => this.clearSession(),
        }),
      );
  }

  logout() {
    return this.http
      .post<{ ok: true }>(
        this.apiUrl.endpoint('/auth/logout'),
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(tap(() => this.clearSession()));
  }

  createCompanyAccount(payload: CreateCompanyAccountPayload) {
    return this.http
      .post<CreateCompanyAccountResponse>(this.apiUrl.endpoint('/superuser/companies'), payload, {
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
    const nextSessionContext = response.role === 'company' ? `company:${response.company.public_id}` : 'superuser';
    if (this.sessionContext && this.sessionContext !== nextSessionContext) this.gamificationStore.clear();
    this.sessionContext = nextSessionContext;
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
    this.sessionContext = null;
    this.gamificationStore.clear();
    this.role.set(null);
    this.company.set(null);
    this.companies.set([]);
  }
}
