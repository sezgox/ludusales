import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ContactService } from '../../services/contact.service';
import { LandingLanguage } from '../../services/landing-language.service';
import { ActivatedRoute } from '@angular/router';

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
  readonly i18n = inject(LandingLanguage);
  private readonly formBuilder = inject(FormBuilder);
  private readonly contactService = inject(ContactService);

  readonly variant = input<ContactFormVariant>('dark');
  readonly submitLabel = input('Agendar Llamada ->');
  readonly contactEmail = input('juan.mateo@ludusales.com');
  readonly status = signal<ContactFormStatus>('idle');
  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    company: ['', Validators.required],
    teamSize: ['', Validators.required],
    role: ['', [Validators.required, Validators.maxLength(160)]],
    phone: ['', Validators.maxLength(40)],
    goals: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    founderInterest: ['', Validators.required],
    source: [''],
    message: ['', Validators.maxLength(2000)],
  });
  private readonly route = inject(ActivatedRoute, { optional: true });
  readonly goals = [
    ['Captar nuevos clientes', 'Win new clients'],
    ['Impulsar un producto', 'Promote a product'],
    ['Subir el ticket medio', 'Increase average deal size'],
    ['Constancia todo el mes', 'Consistency all month'],
    ['Activar a todo el equipo', 'Activate the whole team'],
  ];

  constructor() {
    if (this.route?.snapshot.queryParamMap.get('founder') === '1') {
      this.form.controls.founderInterest.setValue('Sí, quiero optar al piloto gratuito');
    }
    const goal = this.route?.snapshot.queryParamMap.get('goal');
    if (goal !== null && goal !== undefined && /^[0-4]$/.test(goal)) {
      this.form.controls.goals.setValue([this.goals[Number(goal)][0]]);
    }
  }

  toggleGoal(goal: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.form.controls.goals.value;
    this.form.controls.goals.setValue(checked ? [...current, goal] : current.filter((item) => item !== goal));
    this.form.controls.goals.markAsTouched();
  }

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
