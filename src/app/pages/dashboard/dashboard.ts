import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import { AuthService } from '../../services/auth.service';

type DashboardSection = 'informacion' | 'premios' | 'gamificacion' | 'ranking';

type DashboardMenuItem = {
  label: string;
  path: string;
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

  readonly company = this.authService.company;
  readonly isMenuOpen = signal(false);
  readonly menu: DashboardMenuItem[] = [
    {
      label: 'Información',
      path: '/dashboard/informacion',
      section: 'informacion',
    },
    {
      label: 'Premios',
      path: '/dashboard/premios',
      section: 'premios',
    },
    {
      label: 'Gamificación',
      path: '/dashboard/gamificacion',
      section: 'gamificacion',
    },
    {
      label: 'Live Ranking',
      path: '/dashboard/ranking',
      section: 'ranking',
    },
  ];
  readonly activeSection = computed(() => this.sectionFromUrl(this.currentUrl()));
  readonly companyId = computed(() => this.company()?.public_id.slice(0, 8).toUpperCase() ?? 'SIN ID');

  toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
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
}
