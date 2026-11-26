import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiUrlService } from './api-url.service';

export type ContactRequest = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  teamSize: string;
  role?: string;
  phone?: string;
  goals?: string[];
  founderInterest?: string;
  source?: string;
  message?: string;
};

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  sendContactRequest(payload: ContactRequest) {
    return this.http.post<void>(this.apiUrl.endpoint('/contact'), payload);
  }
}

