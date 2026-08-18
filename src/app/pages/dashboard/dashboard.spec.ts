import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([{ path: 'dashboard/:section', component: Dashboard }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('detects informacion from the current url', async () => {
    await router.navigateByUrl('/dashboard/informacion');
    fixture.detectChanges();

    expect(component.activeSection()).toBe('informacion');
  });

  it('detects ranking from the current url', async () => {
    await router.navigateByUrl('/dashboard/ranking');
    fixture.detectChanges();

    expect(component.activeSection()).toBe('ranking');
  });

  it('marks the active menu link', async () => {
    await router.navigateByUrl('/dashboard/premios');
    fixture.detectChanges();

    const activeLink: HTMLAnchorElement | null = fixture.nativeElement.querySelector(
      '.dashboard-nav-link.is-active',
    );

    expect(activeLink?.textContent?.trim()).toBe('Premios');
    expect(activeLink?.getAttribute('aria-current')).toBe('page');
  });
});
