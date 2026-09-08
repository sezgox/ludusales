import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Gamification, GamificationDetail } from '../models/gamification';
import { GamificationStore } from './gamification.store';

const companyA = 'company-a';
const companyB = 'company-b';

describe('GamificationStore', () => {
  let store: GamificationStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(GamificationStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads and exposes one company list and its selected detail', async () => {
    const item = gamification('game-a', companyA, '<p>Primera</p>');
    store.selectCompany(companyA);

    const listPromise = store.ensureCompany(companyA);
    expect(store.isLoadingGamifications()).toBe(true);
    httpMock.expectOne(listUrl(companyA)).flush({ ok: true, gamifications: [item] });
    await listPromise;

    store.selectGamification(item.publicId);
    const detailPromise = store.ensureDetail(companyA, item.publicId);
    expect(store.isLoadingDetail()).toBe(true);
    httpMock.expectOne(detailUrl(companyA, item.publicId)).flush({ ok: true, gamification: detail(item) });
    await detailPromise;

    expect(store.gamifications()).toEqual([item]);
    expect(store.selectedGamificationPublicId()).toBe(item.publicId);
    expect(store.selectedGamification()).toEqual(detail(item));
    expect(store.isLoadingGamifications()).toBe(false);
    expect(store.isLoadingDetail()).toBe(false);
  });

  it('deduplicates simultaneous list and detail requests', async () => {
    const item = gamification('game-a', companyA, '<p>Primera</p>');
    store.selectCompany(companyA);

    const firstList = store.ensureCompany(companyA);
    const secondList = store.ensureCompany(companyA);
    expect(secondList).toBe(firstList);
    httpMock.expectOne(listUrl(companyA)).flush({ ok: true, gamifications: [item] });
    await Promise.all([firstList, secondList]);

    store.selectGamification(item.publicId);
    const firstDetail = store.ensureDetail(companyA, item.publicId);
    const secondDetail = store.ensureDetail(companyA, item.publicId);
    expect(secondDetail).toBe(firstDetail);
    httpMock.expectOne(detailUrl(companyA, item.publicId)).flush({ ok: true, gamification: detail(item) });
    await Promise.all([firstDetail, secondDetail]);
  });

  it('keeps separate caches and selections for every visited company', async () => {
    const itemA = gamification('game-a', companyA, '<p>Empresa A</p>');
    const itemB = gamification('game-b', companyB, '<p>Empresa B</p>');

    await loadCompany(companyA, itemA);
    store.selectGamification(itemA.publicId);
    await loadDetail(companyA, itemA);

    await loadCompany(companyB, itemB);
    store.selectGamification(itemB.publicId);
    await loadDetail(companyB, itemB);

    store.selectCompany(companyA);
    await store.ensureCompany(companyA);
    await store.ensureDetail(companyA, itemA.publicId);

    expect(store.gamifications()).toEqual([itemA]);
    expect(store.selectedGamificationPublicId()).toBe(itemA.publicId);
    expect(store.selectedGamification()?.description).toBe('<p>Empresa A</p>');
    httpMock.expectNone(() => true);
  });

  it('keeps cached content visible while a forced detail refresh is running', async () => {
    const original = gamification('game-a', companyA, '<p>Original</p>');
    await loadCompany(companyA, original);
    store.selectGamification(original.publicId);
    await loadDetail(companyA, original);

    const refreshPromise = store.ensureDetail(companyA, original.publicId, true);
    expect(store.selectedGamification()?.description).toBe('<p>Original</p>');
    expect(store.isLoadingDetail()).toBe(false);

    const updated = { ...original, description: '<p>Actualizada</p>' };
    httpMock.expectOne(detailUrl(companyA, original.publicId)).flush({ ok: true, gamification: detail(updated) });
    await refreshPromise;

    expect(store.selectedGamification()?.description).toBe('<p>Actualizada</p>');
    expect(store.gamifications()[0].description).toBe('<p>Actualizada</p>');
  });

  it('clears all state and ignores responses from the previous session', async () => {
    store.selectCompany(companyA);
    const pending = store.ensureCompany(companyA);
    const request = httpMock.expectOne(listUrl(companyA));

    store.clear();
    request.flush({ ok: true, gamifications: [gamification('stale', companyA, '<p>Anterior</p>')] });
    await pending;

    expect(store.selectedCompanyPublicId()).toBeNull();
    expect(store.gamifications()).toEqual([]);
    expect(store.selectedGamification()).toBeNull();
    expect(store.hasCompany(companyA)).toBe(false);
  });

  async function loadCompany(companyPublicId: string, item: Gamification): Promise<void> {
    store.selectCompany(companyPublicId);
    const pending = store.ensureCompany(companyPublicId);
    httpMock.expectOne(listUrl(companyPublicId)).flush({ ok: true, gamifications: [item] });
    await pending;
  }

  async function loadDetail(companyPublicId: string, item: Gamification): Promise<void> {
    const pending = store.ensureDetail(companyPublicId, item.publicId);
    httpMock.expectOne(detailUrl(companyPublicId, item.publicId)).flush({ ok: true, gamification: detail(item) });
    await pending;
  }
});

function gamification(publicId: string, companyPublicId: string, description: string): Gamification {
  return {
    publicId,
    companyPublicId,
    title: description.replace(/<[^>]*>/g, ''),
    description,
    imageUrl: null,
    startAt: '2027-01-02T09:00:00.000Z',
    endAt: '2027-02-01T18:00:00.000Z',
    goal: '100.00',
    valuePrecision: 2,
    goalUnit: 'ventas',
    status: 'active',
    outcome: 'pending',
    createdAt: '2027-01-01 00:00:00',
    updatedAt: '2027-01-01 00:00:00',
    closedAt: null,
  };
}

function detail(item: Gamification): GamificationDetail {
  return { ...item, prizes: [], ranking: [] };
}

function listUrl(companyPublicId: string): string {
  return `http://localhost:8787/companies/${companyPublicId}/gamifications`;
}

function detailUrl(companyPublicId: string, gamificationPublicId: string): string {
  return `${listUrl(companyPublicId)}/${gamificationPublicId}`;
}
