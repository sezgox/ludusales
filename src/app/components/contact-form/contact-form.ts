import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ContactService } from '../../services/contact.service';

type ContactFormStatus = 'idle' | 'sending' | 'sent' | 'error';
type ContactFormVariant = 'dark' | 'light';

@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.contact-form-host--dark]': 'variant() === "dark"',
    '[class.contact-form-host--light]': 'variant() === "light"',
  },
})
export class ContactForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly contactService = inject(ContactService);

  readonly variant = input<ContactFormVariant>('dark');
  readonly submitLabel = input('Agendar Llamada ->');
  readonly contactEmail = input('juan.mateo@ludusales.com');
  readonly status = signal<ContactFormStatus>('idle');
  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    company: ['', Validators.required],
    teamSize: ['', Validators.required],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.status.set('sending');

    try {
      await firstValueFrom(this.contactService.sendContactRequest(this.form.getRawValue()));
      this.status.set('sent');
      this.form.reset();
    } catch (error) {
      console.error('Unable to submit contact form', error);
      this.status.set('error');
    }
  }
}
