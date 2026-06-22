import { NgOptimizedImage } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LandingHeader } from '@components/landing-header/landing-header';

@Component({
  selector: 'app-landing',
  imports: [LandingHeader, NgOptimizedImage, ReactiveFormsModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);

  readonly performanceProgress = signal(0);
  readonly contactEmail = 'juanma@ludusales.com';
  readonly contactForm = this.formBuilder.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    company: ['', Validators.required],
    teamSize: ['', Validators.required],
  });

  constructor() {
    afterNextRender(() => {
      const intervalId = window.setInterval(() => {
        this.performanceProgress.update((value) => (value >= 100 ? 0 : value + 1));
      }, 40);

      this.destroyRef.onDestroy(() => window.clearInterval(intervalId));
    });
  }

  submitContactForm(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, company, teamSize } = this.contactForm.getRawValue();
    const subject = encodeURIComponent(`Solicitud de llamada - ${company}`);
    const body = encodeURIComponent(
      [
        'Hola Ludus Sales,',
        '',
        'Quiero agendar una llamada.',
        '',
        `Nombre: ${firstName} ${lastName}`,
        `Email: ${email}`,
        `Empresa: ${company}`,
        `Tamaño del equipo de ventas: ${teamSize}`,
      ].join('\n'),
    );

    globalThis.location?.assign(`mailto:${this.contactEmail}?subject=${subject}&body=${body}`);
  }
}
