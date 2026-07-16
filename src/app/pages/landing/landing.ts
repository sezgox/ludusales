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
import { firstValueFrom } from 'rxjs';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { ContactService } from '../../services/contact.service';

type ContactFormStatus = 'idle' | 'sending' | 'sent' | 'error';

@Component({
  selector: 'app-landing',
  imports: [LandingHeader, NgOptimizedImage, ReactiveFormsModule, ScrollRevealDirective],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly contactService = inject(ContactService);

  readonly performanceProgress = signal(0);
  readonly contactEmail = 'juanma@ludusales.com';
  readonly contactFormStatus = signal<ContactFormStatus>('idle');
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

  async submitContactForm(): Promise<void> {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.contactFormStatus.set('sending');

    try {
      await firstValueFrom(this.contactService.sendContactRequest(this.contactForm.getRawValue()));
      this.contactFormStatus.set('sent');
      this.contactForm.reset();
    } catch (error) {
      console.error('Unable to submit contact form', error);
      this.contactFormStatus.set('error');
    }
  }
}
