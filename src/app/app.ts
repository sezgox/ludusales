import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router, { optional: true });

  constructor() {
    if (
      !isPlatformBrowser(this.platformId) ||
      !this.document.documentElement.classList.contains('dashboard-auth-check') ||
      !this.router
    ) {
      return;
    }

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.clearDashboardAuthLoader());
  }

  private clearDashboardAuthLoader(): void {
    this.document.documentElement.classList.remove('dashboard-auth-check');
    this.document.getElementById('dashboard-auth-loader')?.remove();
  }
}
