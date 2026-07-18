import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BackofficeService } from './backoffice.service';

describe('BackofficeService', () => {
  let service: BackofficeService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(BackofficeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('stores the authenticated owner session', () => {
    service.loadAuth().subscribe();

    const request = http.expectOne('http://localhost:8787/auth/me');
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      authenticated: true,
      user: {
        email: 'juan.mateoc@outlook.com',
        publicEmail: 'juanma@ludusales.com',
        role: 'owner',
        name: 'Juanma',
      },
    });

    expect(service.auth()).toEqual({
      authenticated: true,
      user: {
        email: 'juan.mateoc@outlook.com',
        publicEmail: 'juanma@ludusales.com',
        role: 'owner',
        name: 'Juanma',
      },
    });
  });

  it('posts replies with credentials', () => {
    service.replyToMessage('message-key', 'Hola').subscribe();

    const request = http.expectOne('http://localhost:8787/backoffice/messages/message-key/reply');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({ message: 'Hola' });
    request.flush({ ok: true, id: 'resend-id', createdAt: '2026-07-18T19:31:00.000Z' });
  });
});
