import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ContactForm } from '@components/contact-form/contact-form';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';

type LoginMode = 'access-code' | 'contact';
type LoginStatus = 'idle' | 'submitting' | 'error';

@Component({
  selector: 'app-login',
  imports: [ContactForm, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly mode = signal<LoginMode>('access-code');
  readonly status = signal<LoginStatus>('idle');
  readonly form = this.formBuilder.nonNullable.group({
    accessCode: ['', Validators.required],
  });

  showContactForm(): void {
    this.mode.set('contact');
    this.status.set('idle');
  }

  showAccessCodeForm(): void {
    this.mode.set('access-code');
    this.status.set('idle');
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.status.set('submitting');

    try {
      await firstValueFrom(this.authService.login(this.form.controls.accessCode.value));
      await this.router.navigateByUrl('/dashboard');
    } catch (error) {
      console.error('Unable to log in', error);
      this.status.set('error');
    }
  }
}
