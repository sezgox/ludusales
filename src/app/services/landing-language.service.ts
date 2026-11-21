import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LandingLanguage {
  readonly language = signal<'es' | 'en'>('es');

  text(es: string, en: string): string {
    return this.language() === 'es' ? es : en;
  }
}
