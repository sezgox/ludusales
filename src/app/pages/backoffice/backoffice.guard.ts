import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { BackofficeService } from './backoffice.service';

export const backofficeGuard: CanActivateFn = () => {
  const backoffice = inject(BackofficeService);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  return backoffice.loadAuth().pipe(
    map(() => true),
    catchError(() => of(true)),
  );
};
