import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamificationDetail } from '../../../models/gamification';
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
    component.createForm.setValue({ name: 'Viaje' });
    const createPromise = component.createPrize();
    const request = httpMock.expectOne('http://localhost:8787/superuser/gamifications/game-id/prizes');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Viaje' });
    request.flush({ ok: true, prize: { publicId: 'prize-id' } });
    await createPromise;
    expect(component.createForm.controls.name.value).toBe('');
  });

  it('hides write controls for closed gamifications', () => {
    fixture.componentRef.setInput('gamification', prizeGamification('closed'));
    fixture.detectChanges();
    expect(component.canEdit()).toBe(false);
    expect(fixture.nativeElement.querySelector('.create-prize')).toBeNull();
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
    status,
    outcome: status === 'closed' ? 'missed' : 'pending',
    createdAt: '2027-01-01',
    updatedAt: '2027-01-01',
    closedAt: status === 'closed' ? '2027-02-01' : null,
    prizes: [],
    ranking: [],
  };
}
