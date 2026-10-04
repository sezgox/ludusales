import { NgOptimizedImage } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContactForm } from '@components/contact-form/contact-form';
import { LandingHeader } from '@components/landing-header/landing-header';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-landing',
  imports: [LandingHeader, NgOptimizedImage, ContactForm, RouterLink, ScrollRevealDirective],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'pageClass',
  },
})
export class Landing {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  readonly performanceProgress = signal(0);
  readonly pageClass = `landing--${this.route.snapshot.data['landingPage'] ?? 'home'}`;

  constructor() {
    afterNextRender(() => {
      let timerId = 0;

      const scheduleNextTick = (delay: number) => {
        timerId = window.setTimeout(() => {
          const nextValue = this.performanceProgress() >= 100 ? 0 : this.performanceProgress() + 1;
          this.performanceProgress.set(nextValue);
          scheduleNextTick(nextValue === 100 ? 1000 : 40);
        }, delay);
      };

      scheduleNextTick(40);
      this.destroyRef.onDestroy(() => window.clearTimeout(timerId));
    });
  }
}
