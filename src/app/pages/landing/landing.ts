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
