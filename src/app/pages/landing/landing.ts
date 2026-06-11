import { Component } from '@angular/core';
import { LandingHeader } from '@components/landing-header/landing-header';

@Component({
  selector: 'app-landing',
  imports: [LandingHeader],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {}
