import { Component, DestroyRef, inject, signal } from '@angular/core';
import { LandingHeader } from '@components/landing-header/landing-header';

@Component({
  selector: 'app-landing',
  imports: [LandingHeader],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  private readonly destroyRef = inject(DestroyRef);

  readonly performanceProgress = signal(0);

  constructor() {
    const intervalId = window.setInterval(() => {
      this.performanceProgress.update((value) => (value >= 100 ? 0 : value + 1));
    }, 40);

    this.destroyRef.onDestroy(() => window.clearInterval(intervalId));
  }
}
