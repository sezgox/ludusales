import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingHero } from './landing-hero';

describe('LandingHero', () => {
  let fixture: ComponentFixture<LandingHero>;
  let hero: LandingHero;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LandingHero], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(LandingHero);
    hero = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('unlocks the first sale and client badges for a new client', () => {
    hero.addPoints(200);
    expect(hero.badges().filter((badge) => badge.unlocked).map((badge) => badge.id)).toEqual(['first', 'client']);
  });

  it('updates levels, streak and win message and resets the game', () => {
    hero.addPoints(200);
    hero.addPoints(200);
    hero.addPoints(200);
    fixture.detectChanges();
    expect(hero.level()).toBe(3);
    expect(hero.progress()).toBe(0);
    expect(hero.streak()).toBe(3);
    expect(hero.badges().every((badge) => badge.unlocked)).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Eso es vender jugando');
    hero.reset();
    fixture.detectChanges();
    expect(hero.points()).toBe(0);
    expect(hero.streak()).toBe(0);
    expect(hero.badges().every((badge) => !badge.unlocked)).toBe(true);
    expect(fixture.nativeElement.textContent).not.toContain('Eso es vender jugando');
  });

  it('translates game state and links to the existing routes', () => {
    hero.i18n.language.set('en');
    hero.addPoints(100);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('First sale');
    expect(fixture.nativeElement.querySelector('a.offer').getAttribute('href')).toBe('/piloto');
    expect(fixture.nativeElement.querySelector('.btn-gold').getAttribute('href')).toBe('/contacto');
    expect(fixture.nativeElement.querySelector('.btn-soft').getAttribute('href')).toBe('/funcionamiento');
  });
});
