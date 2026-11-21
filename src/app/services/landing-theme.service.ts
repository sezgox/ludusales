import { afterNextRender, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LandingTheme {
  readonly dark = signal(false);

  constructor() {
    afterNextRender(() => {
      try { this.dark.set(localStorage.getItem('ludus-theme') === 'dark'); } catch { /* Storage is optional. */ }
    });
  }

  toggle(): void {
    this.dark.update((dark) => !dark);
    try { localStorage.setItem('ludus-theme', this.dark() ? 'dark' : 'light'); } catch { /* Storage is optional. */ }
  }
}
