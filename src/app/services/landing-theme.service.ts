import { afterNextRender, DestroyRef, inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LandingTheme {
  readonly dark = signal(false);
  private manuallySelected = false;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (this.manuallySelected) return;
      let saved: string | null = null;
      try {
        saved = localStorage.getItem('ludus-theme');
      } catch {
        // Browser preferences still work when storage is unavailable.
      }
      if (saved === 'dark' || saved === 'light') {
        this.manuallySelected = true;
        this.dark.set(saved === 'dark');
        return;
      }
      if (typeof window.matchMedia !== 'function') return;
      const preference = window.matchMedia('(prefers-color-scheme: dark)');
      this.dark.set(preference.matches);
      const updateFromBrowser = (event: MediaQueryListEvent) => {
        if (!this.manuallySelected) this.dark.set(event.matches);
      };
      preference.addEventListener('change', updateFromBrowser);
      this.destroyRef.onDestroy(() => preference.removeEventListener('change', updateFromBrowser));
    });
  }

  toggle(): void {
    this.manuallySelected = true;
    this.dark.update((dark) => !dark);
    try { localStorage.setItem('ludus-theme', this.dark() ? 'dark' : 'light'); } catch { /* Storage is optional. */ }
  }
}
