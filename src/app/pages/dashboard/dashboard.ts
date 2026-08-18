import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [NgOptimizedImage, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly authService = inject(AuthService);
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

  readonly companies = this.authService.companies;
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
    if (!this.isSuperuser()) {
      return this.authService.company();
    }

    const selectedCompanyPublicId = this.selectedCompanyPublicId();

    return this.companies().find((company) => company.public_id === selectedCompanyPublicId) ?? null;
  });
  readonly menu: DashboardMenuItem[] = [
    {
      label: 'Informaci\u00f3n',
      section: 'informacion',
    },
    {
      label: 'Premios',
      section: 'premios',
    },
    {
      label: 'Gamificaci\u00f3n',
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

  selectCompany(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement) || !event.target.value) {
      return;
    }

    void this.router.navigateByUrl(this.dashboardPath(this.activeSection(), event.target.value));
  }

  openCreateCompanyDialog(dialog: HTMLDialogElement): void {
    this.createCompanyFeedback.set(null);

    if (!dialog.open) {
      dialog.showModal();
    }
  }

  closeCreateCompanyDialog(dialog: HTMLDialogElement): void {
    if (!this.isCreatingCompany() && dialog.open) {
      dialog.close();
    }
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
    } catch {
      this.createCompanyFeedback.set('No se pudo crear la empresa. Comprueba los datos e int\u00e9ntalo de nuevo.');
    } finally {
      this.isCreatingCompany.set(false);
    }
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
}
