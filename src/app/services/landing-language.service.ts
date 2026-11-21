import { afterNextRender, DestroyRef, inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LandingLanguage {
  readonly language = signal<'es' | 'en'>('es');
  private manuallySelected = false;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (this.manuallySelected) return;
      let saved: string | null = null;
      try {
        saved = localStorage.getItem('ludus-language');
      } catch {
        // Browser preferences still work when storage is unavailable.
      }
      if (saved === 'es' || saved === 'en') {
        this.manuallySelected = true;
        this.language.set(saved);
        return;
      }
      const updateFromBrowser = () => {
        if (!this.manuallySelected) {
          this.language.set(navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es');
        }
      };
      updateFromBrowser();
      window.addEventListener('languagechange', updateFromBrowser);
      this.destroyRef.onDestroy(() => window.removeEventListener('languagechange', updateFromBrowser));
    });
  }

  select(language: 'es' | 'en'): void {
    this.manuallySelected = true;
    this.language.set(language);
    try {
      localStorage.setItem('ludus-language', language);
    } catch {
      // The selection remains active for the current visit.
    }
  }

  text(es: string, en: string): string {
    return this.language() === 'es' ? es : en;
  }
}
