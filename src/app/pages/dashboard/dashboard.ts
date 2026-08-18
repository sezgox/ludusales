import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import { AuthService } from '../../services/auth.service';

type DashboardSection = 'informacion' | 'premios' | 'gamificacion' | 'ranking';

type DashboardMenuItem = {
  label: string;
  section: DashboardSection;
};

@Component({
  selector: 'app-dashboard',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly authService = inject(AuthService);
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

  readonly companies = this.authService.companies;
  readonly companySearch = signal('');
  readonly isMenuOpen = signal(false);
  readonly isSuperuser = computed(() => this.authService.role() === 'superuser');
  readonly filteredCompanies = computed(() => {
    const query = this.normalizeSearch(this.companySearch());
    const companies = this.companies();

    if (!query) {
      return companies;
    }

    return companies.filter((company) => this.normalizeSearch(`${company.name} ${company.public_id}`).includes(query));
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
    if (!this.isSuperuser()) {
      return this.authService.company();
    }

    const selectedCompanyPublicId = this.selectedCompanyPublicId();

    return this.companies().find((company) => company.public_id === selectedCompanyPublicId) ?? null;
  });
  readonly menu: DashboardMenuItem[] = [
    {
      label: 'Información',
      section: 'informacion',
    },
    {
      label: 'Premios',
      section: 'premios',
    },
    {
      label: 'Gamificación',
      section: 'gamificacion',
    },
    {
      label: 'Live Ranking',
      section: 'ranking',
    },
  ];
  readonly activeSection = computed(() => this.sectionFromUrl(this.currentUrl()));
  readonly companyId = computed(() => this.company()?.public_id.slice(0, 8).toUpperCase() ?? 'SIN ID');
  private readonly selectedCompanyUrlEffect = effect(() => {
    if (!this.isSuperuser()) {
      return;
    }

    const selectedCompanyPublicId = this.selectedCompanyPublicId();

    if (!selectedCompanyPublicId || this.routeCompanyPublicId() === selectedCompanyPublicId) {
      return;
    }

    void this.router.navigateByUrl(this.dashboardPath(this.activeSection(), selectedCompanyPublicId), {
      replaceUrl: true,
    });
  });

  toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  dashboardPath(section: DashboardSection, companyPublicId = this.selectedCompanyPublicId()): string {
    if (this.isSuperuser() && companyPublicId) {
      return `/dashboard/${section}/${companyPublicId}`;
    }

    return `/dashboard/${section}`;
  }

  updateCompanySearch(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.companySearch.set(event.target.value);
    }
  }

  selectCompany(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement) || !event.target.value) {
      return;
    }

    void this.router.navigateByUrl(this.dashboardPath(this.activeSection(), event.target.value));
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.authService.logout());
    await this.router.navigateByUrl('/login');
  }

  private sectionFromUrl(url: string): DashboardSection {
    const path = url.split('?')[0].split('#')[0];
    const section = path.split('/').filter(Boolean).at(1);

    if (
      section === 'informacion' ||
      section === 'premios' ||
      section === 'gamificacion' ||
      section === 'ranking'
    ) {
      return section;
    }

    return 'informacion';
  }

  private companyPublicIdFromUrl(url: string): string | null {
    const path = url.split('?')[0].split('#')[0];
    const companyPublicId = path.split('/').filter(Boolean).at(2);

    return companyPublicId ? decodeURIComponent(companyPublicId) : null;
  }

  private normalizeSearch(value: string): string {
    return value.trim().toLocaleLowerCase('es-ES');
  }
}
