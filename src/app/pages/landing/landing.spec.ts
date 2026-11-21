import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { Landing } from './landing';

describe('Landing', () => {
  let component: Landing;
  let fixture: ComponentFixture<Landing>;

  beforeEach(async () => {
    registerLocaleData(localeEs, 'es-ES');
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Landing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('recalculates the estimated impact when inputs change', () => {
    expect(component.monthlyImpact()).toBe(9000);
    component.reps.set(20);
    component.average.set(10000);
    component.uplift.set(10);
    expect(component.monthlyImpact()).toBe(20000);
  });

  it('switches visible copy to English', async () => {
    component.i18n.language.set('en');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Turn your sales targets');
  });

  it('switches goal details and passes the chosen goal to contact', () => {
    component.i18n.language.set('es');
    fixture.detectChanges();
    const tabs: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.goal-tabs button');
    tabs[1].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.goal-panel').textContent).toContain('producto estratégico');
    expect(fixture.nativeElement.querySelector('.goal-cta').getAttribute('href')).toBe('/contacto?goal=1');
    tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    expect(fixture.nativeElement.querySelector('.goal-panel').textContent).toContain('venta cruzada');
  });
});
