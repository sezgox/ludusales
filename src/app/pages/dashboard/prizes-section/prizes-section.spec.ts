import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamificationDetail, Prize } from '../../../models/gamification';
import { PrizesSection } from './prizes-section';

describe('PrizesSection', () => {
  let fixture: ComponentFixture<PrizesSection>;
  let component: PrizesSection;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrizesSection],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PrizesSection);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('gamification', prizeGamification('draft'));
    fixture.componentRef.setInput('isSuperuser', true);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('creates a named prize without requiring an image', async () => {
    component.createForm.setValue({ name: 'Viaje', rankingPosition: 1, estimatedValue: '99.95' });
    const createPromise = component.createPrize();
    const request = httpMock.expectOne('http://localhost:8787/superuser/gamifications/game-id/prizes');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Viaje', rankingPosition: 1, estimatedValue: 99.95 });
    request.flush({ ok: true, prize: { publicId: 'prize-id' } });
    await createPromise;
    expect(component.createForm.controls.name.value).toBe('');
  });

  it('keeps write controls available for inactive gamifications', () => {
    fixture.componentRef.setInput('gamification', prizeGamification('inactive'));
    fixture.detectChanges();
    expect(component.canEdit()).toBe(true);
    expect(fixture.nativeElement.querySelector('.create-prize')).not.toBeNull();
  });

  it('does not show an empty estimated-value label while another prize is being edited', () => {
    const firstPrize = prize('first-prize', 'Experiencia gastronómica', 1, Number.NaN);
    const secondPrize = prize('second-prize', 'Tarjeta regalo', 2, null);
    fixture.componentRef.setInput('gamification', {
      ...prizeGamification('draft'),
      prizes: [firstPrize, secondPrize],
    });
    fixture.detectChanges();

    component.editPrize(secondPrize);
    fixture.detectChanges();

    const firstCard = (fixture.nativeElement.querySelectorAll('.prize-card') as NodeListOf<HTMLElement>)[0];
    expect(firstCard.textContent).not.toContain('Valor estimado:');
  });
});

function prizeGamification(status: GamificationDetail['status']): GamificationDetail {
  return {
    publicId: 'game-id',
    companyPublicId: 'company-id',
    title: 'Reto',
    description: '<p>Reto</p>',
    imageUrl: null,
    startAt: '2027-01-01T09:00:00.000Z',
    endAt: '2027-02-01T09:00:00.000Z',
    goal: '100.00',
    valuePrecision: 2,
    goalUnit: 'ventas',
    rankingUnit: 'Ludu Points',
    maxLiveRanking: 5,
    status,
    outcome: status === 'inactive' || status === 'closed' ? 'missed' : 'pending',
    createdAt: '2027-01-01',
    updatedAt: '2027-01-01',
    actualEndAt: status === 'inactive' || status === 'closed' ? '2027-02-01' : null,
    prizes: [],
    ranking: [],
    rules: [],
    blockOneCards: [],
    blockTwoCards: [],
  };
}

function prize(
  publicId: string,
  name: string,
  rankingPosition: number,
  estimatedValue: number | null,
): Prize {
  return {
    publicId,
    name,
    pictureUrl: null,
    sortOrder: rankingPosition - 1,
    rankingPosition,
    estimatedValue,
    createdAt: '2027-01-01',
    updatedAt: '2027-01-01',
  };
}
