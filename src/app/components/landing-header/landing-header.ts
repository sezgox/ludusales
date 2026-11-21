import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideMenu, LucideMoon, LucideSun, LucideX } from '@lucide/angular';
import { LandingLanguage } from '../../services/landing-language.service';
import { LandingTheme } from '../../services/landing-theme.service';

@Component({
  selector: 'app-landing-header',
  imports: [NgOptimizedImage, NgTemplateOutlet, RouterLink, RouterLinkActive, LucideMenu, LucideMoon, LucideSun, LucideX],
  templateUrl: './landing-header.html',
  styleUrl: './landing-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingHeader {
  readonly i18n = inject(LandingLanguage);
  readonly theme = inject(LandingTheme);
  readonly menuOpen = signal(false);
}
