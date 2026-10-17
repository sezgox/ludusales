import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideChevronDown, LucideMail } from '@lucide/angular';
import { ContactForm } from '@components/contact-form/contact-form';
import { LandingHeader } from '@components/landing-header/landing-header';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-landing',
  imports: [LandingHeader, NgOptimizedImage, ContactForm, RouterLink, LucideChevronDown, LucideMail, ScrollRevealDirective],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'pageClass',
  },
})
export class Landing {
  private readonly route = inject(ActivatedRoute);

  readonly pageClass = `landing--${this.route.snapshot.data['landingPage'] ?? 'home'}`;
  readonly showDashboardCta = this.route.snapshot.data['landingPage'] === 'how-it-works';
}
