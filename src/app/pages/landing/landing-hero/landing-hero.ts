import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowDownRight, LucideCheck, LucideLockKeyhole } from '@lucide/angular';
import { LandingLanguage } from '../../../services/landing-language.service';

@Component({
  selector: 'app-landing-hero',
  imports: [RouterLink, LucideArrowDownRight, LucideCheck, LucideLockKeyhole],
  templateUrl: './landing-hero.html',
  styleUrl: './landing-hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingHero {
  readonly i18n = inject(LandingLanguage);
  readonly points = signal(0);
  readonly sales = signal(0);
  readonly clients = signal(0);
  readonly streak = computed(() => this.sales() + this.clients());
  readonly level = computed(() => Math.floor(this.points() / 300) + 1);
  readonly progress = computed(() => this.points() % 300);
  readonly formattedPoints = computed(() =>
    new Intl.NumberFormat(this.i18n.language() === 'es' ? 'es-ES' : 'en-US').format(this.points()),
  );
  readonly actionCount = signal(0);
  readonly lastPoints = signal(0);
  readonly lastBadge = signal('');
  readonly badges = computed(() => [
    { id: 'first', es: 'Primera venta', en: 'First sale', unlocked: this.streak() >= 1 },
    { id: 'streak', es: 'Racha de 3', en: '3-sale streak', unlocked: this.streak() >= 3 },
    { id: 'level', es: 'Nivel 2', en: 'Level 2', unlocked: this.points() >= 300 },
    { id: 'client', es: 'Nuevo cliente', en: 'New client', unlocked: this.clients() >= 1 },
  ]);

  addPoints(amount: 100 | 200): void {
    const previous = new Set(this.badges().filter((badge) => badge.unlocked).map((badge) => badge.id));
    this.points.update((points) => points + amount);
    if (amount === 100) this.sales.update((sales) => sales + 1);
    else this.clients.update((clients) => clients + 1);
    this.lastBadge.set(this.badges().filter((badge) => badge.unlocked && !previous.has(badge.id)).at(-1)?.id ?? '');
    this.lastPoints.set(amount);
    this.actionCount.update((count) => count + 1);
  }

  reset(): void {
    this.points.set(0);
    this.sales.set(0);
    this.clients.set(0);
    this.actionCount.set(0);
    this.lastBadge.set('');
  }
}
