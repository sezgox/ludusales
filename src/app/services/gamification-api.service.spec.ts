import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GamificationPayload } from '../models/gamification';
import { GamificationApiService } from './gamification-api.service';

describe('GamificationApiService', () => {
  let service: GamificationApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(GamificationApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads company gamifications with credentials', () => {
    service.list('company/id').subscribe();
    const request = httpMock.expectOne('http://localhost:8787/companies/company%2Fid/gamifications');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true, gamifications: [] });
  });

  it('creates gamifications without converting decimal strings', () => {
    const payload: GamificationPayload = {
      title: 'Reto',
      description: '<p>Reto</p>',
      startAt: '2027-01-01T08:00:00.000Z',
      endAt: '2027-02-01T17:00:00.000Z',
      goal: '125.50',
      valuePrecision: 2,
      goalUnit: 'ventas',
    };
    service.create('company-id', payload).subscribe();
    const request = httpMock.expectOne('http://localhost:8787/superuser/companies/company-id/gamifications');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ ok: true, gamification: {} });
  });

  it('uploads raw WebP with the required content type', () => {
    const image = new Blob(['webp'], { type: 'image/webp' });
    service.uploadCover('gamification-id', image).subscribe();
    const request = httpMock.expectOne('http://localhost:8787/superuser/gamifications/gamification-id/image');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toBe(image);
    expect(request.request.headers.get('Content-Type')).toBe('image/webp');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true, imageUrl: 'https://assets.example/cover.webp' });
  });

  it('encodes participant ids and preserves score strings', () => {
    service.upsertRankingEntry('game', 'person/one', { fullName: 'Ana', score: '10.00' }).subscribe();
    const request = httpMock.expectOne(
      'http://localhost:8787/superuser/gamifications/game/ranking/person%2Fone',
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ fullName: 'Ana', score: '10.00' });
    request.flush({ ok: true });
  });
});
