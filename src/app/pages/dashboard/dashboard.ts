import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly company = this.authService.company;

  async logout(): Promise<void> {
    await firstValueFrom(this.authService.logout());
    await this.router.navigateByUrl('/login');
  }
}
