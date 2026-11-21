import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingLanguage } from '../../../services/landing-language.service';
import { LandingSubpages } from './landing-subpages';

describe('LandingSubpages', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingSubpages],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('switches mechanics with the keyboard and translates the selected panel', () => {
    const fixture = TestBed.createComponent(LandingSubpages);
    fixture.componentRef.setInput('page', 'gamification');
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('[role=tab]') as NodeListOf<HTMLButtonElement>;
    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(fixture.nativeElement.querySelector('#sc-1').hidden).toBe(false);
    TestBed.inject(LandingLanguage).language.set('en');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#sc-1').textContent).toContain('Points for what really matters.');
  });

  it.each([
    ['how-it-works', 'Así convertimos tus objetivos en un juego.'],
    ['pilot-campaign', 'Tu primera campaña de 30 días'],
    ['about-us', 'Los equipos no fallan por falta de capacidad.'],
    ['contact', '¿Hablamos de'],
  ])('renders the %s page', (page, heading) => {
    const fixture = TestBed.createComponent(LandingSubpages);
    fixture.componentRef.setInput('page', page);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain(heading);
  });
});
