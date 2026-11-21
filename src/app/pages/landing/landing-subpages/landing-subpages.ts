import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChartColumn, LucideDatabase, LucideFileSpreadsheet, LucideSparkles, LucideTarget, LucideTrendingUp, LucideUsers } from '@lucide/angular';
import { LandingSocial } from '../../../components/landing-social/landing-social';
import { ContactForm } from '../../../components/contact-form/contact-form';
import { LandingLanguage } from '../../../services/landing-language.service';
import { translations } from './translations';

@Component({
  selector: 'app-landing-subpages',
  imports: [NgOptimizedImage, RouterLink, ContactForm, LandingSocial, LucideTarget, LucideUsers, LucideChartColumn, LucideTrendingUp, LucideSparkles, LucideFileSpreadsheet, LucideDatabase],
  templateUrl: './landing-subpages.html',
  styleUrls: ['./landing-subpages.css', './landing-subpages-extra.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingSubpages {
  readonly page = input.required<string>();
  readonly selectedMechanic = signal(0);
  readonly copyStatus = signal('');
  private readonly i18n = inject(LandingLanguage);

  translate(text: string): string {
    return this.i18n.language() === 'en' ? translations[text] ?? text : text;
  }

  onTabKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (this.selectedMechanic() + (event.key === 'ArrowRight' ? 1 : 4)) % 5;
    this.selectedMechanic.set(next);
    const tablist = event.currentTarget as HTMLElement;
    tablist.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
  }

  async copy(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.copyStatus.set(this.i18n.text('Copiado', 'Copied'));
    } catch {
      this.copyStatus.set(this.i18n.text('No se ha podido copiar.', 'Could not copy.'));
    }
  }
}
