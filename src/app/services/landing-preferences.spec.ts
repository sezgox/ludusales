import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingLanguage } from './landing-language.service';
import { LandingTheme } from './landing-theme.service';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class PreferencesHost {
  readonly language = inject(LandingLanguage);
  readonly theme = inject(LandingTheme);
}

describe('Landing browser preferences', () => {
  let systemDark: boolean;
  let preference: EventTarget & { matches: boolean };

  beforeEach(() => {
    localStorage.clear();
    systemDark = true;
    preference = Object.assign(new EventTarget(), { matches: systemDark });
    vi.stubGlobal('matchMedia', vi.fn(() => preference));
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB');
    TestBed.configureTestingModule({ imports: [PreferencesHost] });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('starts from browser preferences when no choices are saved', async () => {
    const fixture = TestBed.createComponent(PreferencesHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.language.language()).toBe('en');
    expect(fixture.componentInstance.theme.dark()).toBe(true);
    preference.dispatchEvent(Object.assign(new Event('change'), { matches: false }));
    expect(fixture.componentInstance.theme.dark()).toBe(false);
  });

  it('prefers saved choices over browser defaults', async () => {
    localStorage.setItem('ludus-language', 'es');
    localStorage.setItem('ludus-theme', 'light');
    const fixture = TestBed.createComponent(PreferencesHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.language.language()).toBe('es');
    expect(fixture.componentInstance.theme.dark()).toBe(false);
  });

  it('falls back to Spanish for unsupported browser languages and invalid saved values', async () => {
    localStorage.setItem('ludus-language', 'invalid');
    localStorage.setItem('ludus-theme', 'invalid');
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR');
    const fixture = TestBed.createComponent(PreferencesHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.language.language()).toBe('es');
    expect(fixture.componentInstance.theme.dark()).toBe(true);
  });

  it('persists manual choices and stops following system theme changes', async () => {
    const fixture = TestBed.createComponent(PreferencesHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.language.select('es');
    fixture.componentInstance.theme.toggle();
    expect(localStorage.getItem('ludus-language')).toBe('es');
    expect(localStorage.getItem('ludus-theme')).toBe('light');
    preference.dispatchEvent(Object.assign(new Event('change'), { matches: true }));
    expect(fixture.componentInstance.theme.dark()).toBe(false);
  });
});
