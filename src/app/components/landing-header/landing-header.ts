import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-header',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './landing-header.html',
  styleUrl: './landing-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingHeader {}
