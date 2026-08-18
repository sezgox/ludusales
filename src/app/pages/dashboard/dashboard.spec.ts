import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Dashboard } from './dashboard';

const demoCompany = {
  public_id: '82b4c7b9-68d1-4cc6-9e36-41d4db4e05f0',
  name: 'Ludus Sales Demo',
};

const betaCompany = {
  public_id: '4c6f2c3d-3f73-4472-a453-4e0d6cb472d8',
  name: 'Ludus Sales Beta',
};

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let router: Router;
  let authService: AuthService;
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
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('detects informacion from the current url', async () => {
    await router.navigateByUrl('/dashboard/informacion');
    fixture.detectChanges();

    expect(component.activeSection()).toBe('informacion');
  });

  it('detects ranking from superuser urls with a company public id', async () => {
    authService.role.set('superuser');
    authService.companies.set([demoCompany, betaCompany]);

    await router.navigateByUrl(`/dashboard/ranking/${betaCompany.public_id}`);
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#dashboard-company-select');

    expect(component.activeSection()).toBe('ranking');
    expect(component.company()?.name).toBe('Ludus Sales Beta');
    expect(select.value).toBe(betaCompany.public_id);
  });

  it('marks the active menu link and preserves the selected superuser company', async () => {
    authService.role.set('superuser');
    authService.companies.set([demoCompany, betaCompany]);

    await router.navigateByUrl(`/dashboard/premios/${betaCompany.public_id}`);
    fixture.detectChanges();

    const activeLink: HTMLAnchorElement | null = fixture.nativeElement.querySelector(
      '.dashboard-nav-link.is-active',
    );

    expect(activeLink?.textContent?.trim()).toBe('Premios');
    expect(activeLink?.getAttribute('aria-current')).toBe('page');
    expect(component.dashboardPath('ranking')).toBe(`/dashboard/ranking/${betaCompany.public_id}`);
  });

  it('shows the company selector only for superusers', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dashboard-company-switcher')).toBeNull();

    authService.role.set('superuser');
    authService.companies.set([demoCompany, betaCompany]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dashboard-company-switcher')).not.toBeNull();
  });

  it('uses the full company list in the superuser selector without a search field', () => {
    authService.role.set('superuser');
    authService.companies.set([demoCompany, betaCompany]);
    fixture.detectChanges();

    const options: NodeListOf<HTMLOptionElement> = fixture.nativeElement.querySelectorAll(
      '#dashboard-company-select option',
    );

    expect(fixture.nativeElement.querySelector('#dashboard-company-search')).toBeNull();
    expect(Array.from(options).map((option) => option.value)).toEqual([
      demoCompany.public_id,
      betaCompany.public_id,
    ]);
  });

  it('changes the url when a superuser selects another company', async () => {
    authService.role.set('superuser');
    authService.companies.set([demoCompany, betaCompany]);

    await router.navigateByUrl(`/dashboard/gamificacion/${demoCompany.public_id}`);
    fixture.detectChanges();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#dashboard-company-select');

    select.value = betaCompany.public_id;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(router.url).toBe(`/dashboard/gamificacion/${betaCompany.public_id}`);
  });

  it('creates a company account from the superuser dialog and navigates to it', async () => {
    authService.role.set('superuser');
    authService.companies.set([demoCompany, betaCompany]);
    await router.navigateByUrl(`/dashboard/informacion/${demoCompany.public_id}`);
    component.createCompanyForm.setValue({
      companyName: 'Ludus Sales Nueva',
      email: 'nueva@ludusales.local',
      accessCode: 'NUEVA-2026',
    });

    const dialog = {
      close: vi.fn(),
    } as unknown as HTMLDialogElement;
    const createPromise = component.createCompanyAccount(dialog);
    const request = httpMock.expectOne('http://localhost:8787/superuser/companies');

    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({
      companyName: 'Ludus Sales Nueva',
      accountName: 'Ludus Sales Nueva',
      email: 'nueva@ludusales.local',
      accessCode: 'NUEVA-2026',
    });
    request.flush({
      ok: true,
      company: {
        public_id: '33333333-3333-4333-8333-333333333333',
        name: 'Ludus Sales Nueva',
      },
    });
    await createPromise;

    expect(dialog.close).toHaveBeenCalledOnce();
    expect(router.url).toBe('/dashboard/informacion/33333333-3333-4333-8333-333333333333');
    expect(authService.companies().map((company) => company.name)).toEqual([
      'Ludus Sales Beta',
      'Ludus Sales Demo',
      'Ludus Sales Nueva',
    ]);
  });
});
