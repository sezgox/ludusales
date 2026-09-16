import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GamificationDetail } from '../../../models/gamification';
import { InformationSection } from './information-section';

describe('InformationSection', () => {
  let fixture: ComponentFixture<InformationSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformationSection],
      providers: [provideHttpClient(), provideRouter([])],
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
  };
}
