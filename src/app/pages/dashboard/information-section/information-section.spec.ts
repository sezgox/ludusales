import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { icons, isLucideIconComponent, provideLucideIcons } from '@lucide/angular';
import { GamificationDetail } from '../../../models/gamification';
import { InformationSection } from './information-section';

describe('InformationSection', () => {
  let fixture: ComponentFixture<InformationSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformationSection],
      providers: [provideHttpClient(), provideRouter([]), provideLucideIcons(...Object.values(icons).filter(isLucideIconComponent))],
    }).compileComponents();

    fixture = TestBed.createComponent(InformationSection);
    fixture.componentRef.setInput('gamification', gamification());
    fixture.componentRef.setInput('isSuperuser', false);
    fixture.detectChanges();
  });

  it('shows information layout with cover, steps and ranking call to action', () => {
    const element = fixture.nativeElement as HTMLElement;
    const title = element.querySelector('h2');
    const image = element.querySelector('.information-media');
    const description = element.querySelector('.information-description');

    expect(title?.textContent?.trim()).toBe('Información de la Gamificación');
    expect(element.querySelector('.gamification-title')?.textContent?.trim()).toBe('Reto trimestral');
    expect(image?.compareDocumentPosition(description!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(description?.querySelector('strong')?.textContent).toBe('ventas');
    expect(element.textContent).toContain('¿Cómo funciona?');
    expect(element.querySelectorAll('.step-card')).toHaveLength(4);
    expect(element.querySelector('.ranking-link')?.textContent).toContain('Ver ranking');
    expect(element.querySelector('.configuration-card')?.textContent).toContain('Reto trimestral');
    expect(element.querySelector('.points-card')?.textContent).toContain('Ventas cerradas');
    expect(element.querySelector('.configuration-card')?.textContent).not.toContain('Ranking en directo');
  });

  it('hides the points section when the gamification has no rules', () => {
    fixture.componentRef.setInput('gamification', { ...gamification(), rules: [] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.points-card')).toBeNull();
  });

  it('omits an unset objective from the public configuration', () => {
    fixture.componentRef.setInput('gamification', { ...gamification(), goal: null, goalUnit: null });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.configuration-card')?.textContent).not.toContain('Objetivo');
  });

  it('shows direct rule editing controls to a superuser in information', () => {
    fixture.componentRef.setInput('isSuperuser', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.rules-form')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-rule-editor')).not.toBeNull();

    fixture.componentRef.setInput('gamification', {
      ...gamification(),
      rules: [
        ...gamification().rules,
        { position: 2, title: 'Calidad', description: 'La calidad también cuenta.', iconName: 'star' },
      ],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.rule-card')).toHaveLength(2);
  });

  it('keeps lifecycle controls and Live Ranking limit inside configuration edit mode', () => {
    fixture.componentRef.setInput('isSuperuser', true);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.editConfiguration();
    fixture.detectChanges();

    const limit = fixture.nativeElement.querySelector('[formControlName="maxLiveRanking"]') as HTMLInputElement;
    expect(limit.value).toBe('5');
    expect(fixture.nativeElement.querySelector('.configuration-lifecycle')?.textContent).toContain('Desactivar');
    expect(fixture.nativeElement.querySelector('.configuration-lifecycle')?.textContent).toContain('Eliminar gamificación');
  });
});

function gamification(): GamificationDetail {
  return {
    publicId: 'game-id',
    companyPublicId: 'company-id',
    title: 'Reto trimestral',
    description: '<p>Consigue más <strong>ventas</strong>.</p>',
    imageUrl: 'https://assets.ludusales.com/cover.webp',
    startAt: '2027-01-01T09:00:00.000Z',
    endAt: '2027-02-01T09:00:00.000Z',
    goal: '100',
    valuePrecision: 0,
    goalUnit: 'ventas',
    maxLiveRanking: 5,
    status: 'active',
    outcome: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    closedAt: null,
    prizes: [],
    ranking: [],
    blockOneCards: [],
    blockTwoCards: [],
    rules: [
      { position: 1, title: 'Ventas cerradas', description: 'Suma puntos por cada venta realizada.', iconName: 'chart-column' },
    ],
  };
}
