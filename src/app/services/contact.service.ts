import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

export type ContactRequest = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  teamSize: string;
};

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  sendContactRequest(payload: ContactRequest) {
    return this.http.post<void>(this.contactEndpoint(), payload);
  }

  private contactEndpoint(): string {
    if (isPlatformBrowser(this.platformId)) {
      const hostname = globalThis.location?.hostname;

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8787/contact';
      }
    }

    return 'https://api.ludusales.com/contact';
  }
}

