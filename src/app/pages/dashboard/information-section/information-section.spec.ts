import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamificationDetail } from '../../../models/gamification';
import { InformationSection } from './information-section';

describe('InformationSection', () => {
  let fixture: ComponentFixture<InformationSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformationSection],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(InformationSection);
    fixture.componentRef.setInput('gamification', gamification());
    fixture.componentRef.setInput('isSuperuser', false);
    fixture.detectChanges();
  });

  it('shows title, image and formatted description in that order without section labels', () => {
    const element = fixture.nativeElement as HTMLElement;
    const title = element.querySelector('h2');
    const image = element.querySelector('.information-media');
    const description = element.querySelector('.information-description');

    expect(title?.textContent?.trim()).toBe('Reto trimestral');
    expect(image?.compareDocumentPosition(description!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(description?.querySelector('strong')?.textContent).toBe('ventas');
    expect(element.textContent).not.toContain('Sección principal');
    expect(element.textContent).not.toContain('Presentación');
    expect(element.textContent).not.toContain('Imagen pública');
    expect(element.textContent).not.toContain('Portada');
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
    status: 'active',
    outcome: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    closedAt: null,
    prizes: [],
    ranking: [],
  };
}
