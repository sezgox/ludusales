import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('logs in with credentials and stores the authenticated company', () => {
    service.login('DEMO-ACCESS-2026').subscribe();

    const request = httpMock.expectOne('http://localhost:8787/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({ accessCode: 'DEMO-ACCESS-2026' });
    request.flush({
      ok: true,
      role: 'company',
      company: {
        public_id: '82b4c7b9-68d1-4cc6-9e36-41d4db4e05f0',
        name: 'Ludus Sales Demo',
      },
    });

    expect(service.company()?.name).toBe('Ludus Sales Demo');
    expect(service.role()).toBe('company');
    expect(service.companies()).toEqual([]);
  });

  it('stores superuser sessions with the available companies', () => {
    service.login('OWNER-ACCESS-2026').subscribe();

    const request = httpMock.expectOne('http://localhost:8787/auth/login');
    request.flush({
      ok: true,
      role: 'superuser',
      companies: [
        {
          public_id: '82b4c7b9-68d1-4cc6-9e36-41d4db4e05f0',
          name: 'Ludus Sales Demo',
        },
      ],
    });

    expect(service.role()).toBe('superuser');
    expect(service.company()).toBeNull();
    expect(service.companies()).toEqual([
      {
        public_id: '82b4c7b9-68d1-4cc6-9e36-41d4db4e05f0',
        name: 'Ludus Sales Demo',
      },
    ]);
  });

  it('clears the company on logout', () => {
    service.role.set('superuser');
    service.companies.set([
      {
        public_id: '82b4c7b9-68d1-4cc6-9e36-41d4db4e05f0',
        name: 'Ludus Sales Demo',
      },
    ]);

    service.logout().subscribe();

    const request = httpMock.expectOne('http://localhost:8787/auth/logout');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true });

    expect(service.company()).toBeNull();
    expect(service.role()).toBeNull();
    expect(service.companies()).toEqual([]);
  });
});
