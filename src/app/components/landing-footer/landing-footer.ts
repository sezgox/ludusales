import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingSocial } from '../landing-social/landing-social';
import { LandingLanguage } from '../../services/landing-language.service';

@Component({
  selector: 'app-landing-footer',
  imports: [NgOptimizedImage, RouterLink, LandingSocial],
  templateUrl: './landing-footer.html',
  styleUrl: './landing-footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingFooter {
  readonly i18n = inject(LandingLanguage);
}
