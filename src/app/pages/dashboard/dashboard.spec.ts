import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestRequest } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { Gamification, GamificationDetail } from '../../models/gamification';
import { AuthService } from '../../services/auth.service';
import { GamificationStore } from '../../services/gamification.store';
import { Dashboard } from './dashboard';
import { InformationSection } from './information-section/information-section';

const demoCompany = { public_id: '82b4c7b9-68d1-4cc6-9e36-41d4db4e05f0', name: 'Ludus Sales Demo' };
const betaCompany = { public_id: '4c6f2c3d-3f73-4472-a453-4e0d6cb472d8', name: 'Ludus Sales Beta' };

const draftGamification = gamification('draft-id', 'draft', '<p>Reto futuro</p>');
const activeGamification = gamification('active-id', 'active', '<p>Reto activo</p>');

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let router: Router;
  let authService: AuthService;
  let gamificationStore: GamificationStore;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([
          { path: 'dashboard/:section', component: Dashboard },
          { path: 'dashboard/:section/:companyPublicId', component: Dashboard },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
    gamificationStore = TestBed.inject(GamificationStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    fixture?.destroy();
    httpMock.verify();
  });

  it('creates without loading data before authentication exists', () => {
    createComponent();
    expect(component).toBeTruthy();
    httpMock.expectNone(() => true);
  });

  it('loads the authenticated company and detects the route section', async () => {
    await setupCompany('/dashboard/informacion', []);
    expect(component.activeSection()).toBe('informacion');
    expect(fixture.nativeElement.querySelector('.dashboard-company-switcher')).toBeNull();
  });

  it('selects an explicit gamification from the query string', async () => {
    await setupSuperuser(
      `/dashboard/ranking/${betaCompany.public_id}?gamification=${draftGamification.publicId}`,
      betaCompany.public_id,
      [activeGamification, draftGamification],
      draftGamification,
    );
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#dashboard-gamification-select');
    expect(component.activeSection()).toBe('ranking');
    expect(component.company()?.name).toBe('Ludus Sales Beta');
    expect(select.value).toBe(draftGamification.publicId);
  });

  it('uses the explicit title in labels instead of description HTML', () => {
    createComponent();
    expect(
      component.gamificationLabel({
        ...activeGamification,
        title: 'Reto trimestral',
        description: '&lt;p&gt;No debe mostrarse&lt;/p&gt;',
      }),
    ).toBe('Activa · Reto trimestral');
  });

  it('defaults to the active gamification and preserves it in navigation links', async () => {
    await setupSuperuser(
      `/dashboard/premios/${demoCompany.public_id}`,
      demoCompany.public_id,
      [draftGamification, activeGamification],
      activeGamification,
    );
    const activeLink: HTMLAnchorElement = fixture.nativeElement.querySelector('.dashboard-nav-link.is-active');
    const rankingLink: HTMLAnchorElement = Array.from<HTMLAnchorElement>(
      fixture.nativeElement.querySelectorAll('.dashboard-nav-link'),
    ).find((link) => link.textContent?.includes('Live Ranking'))!;
    expect(activeLink.textContent?.trim()).toBe('Premios');
    expect(activeLink.getAttribute('aria-current')).toBe('page');
    expect(rankingLink.getAttribute('href')).toContain(`gamification=${activeGamification.publicId}`);
  });

  it('allows information editing only for superusers', async () => {
    await setupCompany('/dashboard/informacion', [activeGamification], activeGamification);
    expect(fixture.debugElement.query(By.directive(InformationSection)).componentInstance.canEdit()).toBe(false);
    fixture.destroy();

    gamificationStore.clear();
    authService.company.set(null);
    authService.role.set('superuser');
    authService.companies.set([demoCompany, betaCompany]);
    await router.navigateByUrl(`/dashboard/informacion/${demoCompany.public_id}`);
    createComponent();
    await flushGamifications(demoCompany.public_id, [activeGamification], activeGamification);
    expect(fixture.debugElement.query(By.directive(InformationSection)).componentInstance.canEdit()).toBe(true);
  });

  it('reuses the global list and detail when the dashboard section is recreated', async () => {
    await setupCompany('/dashboard/informacion', [activeGamification], activeGamification);
    fixture.destroy();

    await router.navigateByUrl(`/dashboard/premios?gamification=${activeGamification.publicId}`);
    createComponent();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.activeSection()).toBe('premios');
    expect(component.selectedGamification()?.publicId).toBe(activeGamification.publicId);
    httpMock.expectNone(() => true);
  });

  it('changes company through the selector and clears the previous gamification context', async () => {
    await setupSuperuser(`/dashboard/gamificacion/${demoCompany.public_id}`, demoCompany.public_id, []);
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#dashboard-company-select');
    select.value = betaCompany.public_id;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();
    const request = await waitForRequest(`http://localhost:8787/companies/${betaCompany.public_id}/gamifications`);
    request.flush({ ok: true, gamifications: [] });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe(`/dashboard/gamificacion/${betaCompany.public_id}`);
  });

  it('creates a company account and navigates to its empty dashboard', async () => {
    await setupSuperuser(`/dashboard/informacion/${demoCompany.public_id}`, demoCompany.public_id, []);
    component.createCompanyForm.setValue({
      companyName: 'Ludus Sales Nueva',
      email: 'nueva@ludusales.local',
      accessCode: 'NUEVA-2026',
    });
    const dialog = document.createElement('dialog');
    const closeSpy = vi.fn();
    Object.defineProperty(dialog, 'close', { configurable: true, value: closeSpy });
    const createPromise = component.createCompanyAccount(dialog);
    const request = httpMock.expectOne('http://localhost:8787/superuser/companies');
    request.flush({
      ok: true,
      company: { public_id: '33333333-3333-4333-8333-333333333333', name: 'Ludus Sales Nueva' },
    });
    await createPromise;
    fixture.detectChanges();
    const listRequest = await waitForRequest(
      'http://localhost:8787/companies/33333333-3333-4333-8333-333333333333/gamifications',
    );
    listRequest.flush({ ok: true, gamifications: [] });
    expect(closeSpy).toHaveBeenCalledOnce();
    expect(router.url).toBe('/dashboard/informacion/33333333-3333-4333-8333-333333333333');
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  async function setupCompany(route: string, items: Gamification[], selected?: Gamification): Promise<void> {
    authService.role.set('company');
    authService.company.set(demoCompany);
    await router.navigateByUrl(route);
    createComponent();
    await flushGamifications(demoCompany.public_id, items, selected);
  }

  async function setupSuperuser(
    route: string,
    companyPublicId: string,
    items: Gamification[],
    selected?: Gamification,
  ): Promise<void> {
    authService.role.set('superuser');
    authService.companies.set([demoCompany, betaCompany]);
    await router.navigateByUrl(route);
    createComponent();
    await flushGamifications(companyPublicId, items, selected);
  }

  async function flushGamifications(companyPublicId: string, items: Gamification[], selected?: Gamification): Promise<void> {
    const request = await waitForRequest(`http://localhost:8787/companies/${companyPublicId}/gamifications`);
    request.flush({ ok: true, gamifications: items });
    await fixture.whenStable();
    fixture.detectChanges();

    if (selected) {
      const detailRequest = await waitForRequest(
        `http://localhost:8787/companies/${companyPublicId}/gamifications/${selected.publicId}`,
      );
      detailRequest.flush({ ok: true, gamification: detail(selected) });
      await vi.waitFor(() => {
        fixture.detectChanges();
        expect(component.selectedGamification()?.publicId).toBe(selected.publicId);
        expect(component.isLoadingDetail()).toBe(false);
      });
    }
  }

  async function waitForRequest(url: string): Promise<TestRequest> {
    let requests: TestRequest[] = [];
    await vi.waitFor(() => {
      requests = httpMock.match(url);
      expect(requests).toHaveLength(1);
    });
    return requests[0];
  }
});

function gamification(publicId: string, status: Gamification['status'], description: string): Gamification {
  return {
    publicId,
    companyPublicId: demoCompany.public_id,
    title: description.replace(/<[^>]*>/g, ''),
    description,
    imageUrl: null,
    startAt: status === 'active' ? '2027-01-02T09:00:00.000Z' : '2027-01-03T09:00:00.000Z',
    endAt: '2027-02-01T18:00:00.000Z',
    goal: '100.00',
    valuePrecision: 2,
    goalUnit: 'ventas',
    maxLiveRanking: 5,
    status,
    outcome: 'pending',
    createdAt: '2027-01-01 00:00:00',
    updatedAt: '2027-01-01 00:00:00',
    closedAt: null,
  };
}

function detail(item: Gamification): GamificationDetail {
  return { ...item, prizes: [], ranking: [] };
}
