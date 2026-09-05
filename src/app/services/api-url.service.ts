import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiUrlService {
  private readonly platformId = inject(PLATFORM_ID);

  endpoint(path: string): string {
    if (isPlatformBrowser(this.platformId)) {
      const hostname = globalThis.location?.hostname;

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://localhost:8787${path}`;
      }
    }

    return `https://api.ludusales.com${path}`;
  }
}
