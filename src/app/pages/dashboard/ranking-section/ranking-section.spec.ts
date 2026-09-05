import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamificationDetail } from '../../../models/gamification';
import { RankingSection } from './ranking-section';

describe('RankingSection', () => {
  let fixture: ComponentFixture<RankingSection>;
  let component: RankingSection;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankingSection],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RankingSection);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('gamification', rankingGamification());
    fixture.componentRef.setInput('isSuperuser', true);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('renders server-derived tied positions without an editable position field', () => {
    const positions = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.position')).map((cell) =>
      cell.textContent?.trim(),
    );
    expect(positions).toEqual(['1', '1', '3']);
    expect(fixture.nativeElement.querySelector('input[formcontrolname="position"]')).toBeNull();
  });

  it('adds one participant with a generated stable id and exact score string', async () => {
    component.participantForm.setValue({ fullName: 'Diego', score: '12.50' });
    const savePromise = component.addParticipant();
    const request = httpMock.expectOne(
      (candidate) => candidate.url.startsWith('http://localhost:8787/superuser/gamifications/game-id/ranking/'),
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ fullName: 'Diego', score: '12.50' });
    expect(request.request.url.split('/').at(-1)).toMatch(/^[0-9a-f-]{36}$/);
    request.flush({ ok: true });
    await savePromise;
  });

  it('rejects scores with more decimals than the gamification precision', async () => {
    component.participantForm.setValue({ fullName: 'Diego', score: '12.501' });
    await component.addParticipant();
    expect(component.feedback()).toContain('máximo 2 decimales');
    httpMock.expectNone(() => true);
  });
});

function rankingGamification(): GamificationDetail {
  return {
    publicId: 'game-id',
    companyPublicId: 'company-id',
    description: '<p>Reto</p>',
    imageUrl: null,
    startAt: '2027-01-01T09:00:00.000Z',
    endAt: '2027-02-01T09:00:00.000Z',
    goal: '100.00',
    valuePrecision: 2,
    goalUnit: 'ventas',
    status: 'active',
    outcome: 'pending',
    createdAt: '2027-01-01 00:00:00',
    updatedAt: '2027-01-01 00:00:00',
    closedAt: null,
    prizes: [],
    ranking: [
      rankingEntry('one', 'Ana', 1, '50.00'),
      rankingEntry('two', 'Bea', 1, '50.00'),
      rankingEntry('three', 'Carla', 3, '25.00'),
    ],
  };
}

function rankingEntry(externalParticipantId: string, fullName: string, position: number, score: string) {
  return { externalParticipantId, fullName, position, score, createdAt: '2027-01-01', updatedAt: '2027-01-01' };
}
