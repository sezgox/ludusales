import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('allows access when /auth/me succeeds', async () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Observable<boolean | UrlTree>;
    const resultPromise = firstValueFrom(result);
    const request = httpMock.expectOne('http://localhost:8787/auth/me');

    request.flush({
      ok: true,
      role: 'company',
      company: {
        public_id: '82b4c7b9-68d1-4cc6-9e36-41d4db4e05f0',
        name: 'Ludus Sales Demo',
      },
    });

    await expect(resultPromise).resolves.toBe(true);
  });

  it('redirects to login when /auth/me fails', async () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Observable<boolean | UrlTree>;
    const resultPromise = firstValueFrom(result);
    const request = httpMock.expectOne('http://localhost:8787/auth/me');

    request.flush({ error: 'Not authenticated.' }, { status: 401, statusText: 'Unauthorized' });

    const resolved = await resultPromise;
    expect(resolved instanceof UrlTree).toBe(true);
    expect((resolved as UrlTree).toString()).toBe('/login');
  });
});
