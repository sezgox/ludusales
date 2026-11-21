import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LandingHeader } from './landing-header';

describe('LandingHeader', () => {
  let component: LandingHeader;
  let fixture: ComponentFixture<LandingHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingHeader],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes an accessible menu button and updates its expanded state', () => {
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.burger');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-label')).toBeTruthy();
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-controls')).toBe('landing-menu');
  });
});
