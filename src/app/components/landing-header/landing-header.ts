import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideLogIn } from '@lucide/angular';

@Component({
  selector: 'app-landing-header',
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive, LucideLogIn],
  templateUrl: './landing-header.html',
  styleUrl: './landing-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingHeader {}
