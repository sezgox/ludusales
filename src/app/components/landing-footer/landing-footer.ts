import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCamera, LucideLink, LucideUsers } from '@lucide/angular';
import { LandingLanguage } from '../../services/landing-language.service';

@Component({
  selector: 'app-landing-footer',
  imports: [NgOptimizedImage, RouterLink, LucideCamera, LucideLink, LucideUsers],
  templateUrl: './landing-footer.html',
  styleUrl: './landing-footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingFooter {
  readonly i18n = inject(LandingLanguage);
}
