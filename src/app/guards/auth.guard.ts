import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService, type AuthRole } from '../services/auth.service';

function requireRole(role: AuthRole): CanActivateFn {
  return (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.me().pipe(
      map((session) => {
        if (session.role === role) return true;
        if (session.role === 'company') return router.createUrlTree(['/dashboard']);
        const previousAdminLink = /^\/dashboard\/(informacion|premios|gamificacion|ranking)(?=[/?#]|$)/;
        return router.parseUrl(previousAdminLink.test(state.url) ? state.url.replace('/dashboard/', '/admin/') : '/admin');
      }),
      catchError(() => of(router.createUrlTree(['/login']))),
    );
  };
}

export const authGuard = requireRole('company');
export const adminGuard = requireRole('superuser');
