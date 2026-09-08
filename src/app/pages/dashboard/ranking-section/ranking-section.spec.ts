import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamificationDetail } from '../../../models/gamification';
import { RankingSection } from './ranking-section';

describe('RankingSection', () => {
  let fixture: ComponentFixture<RankingSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RankingSection] }).compileComponents();
    fixture = TestBed.createComponent(RankingSection);
    fixture.componentRef.setInput('gamification', rankingGamification());
    fixture.detectChanges();
  });

  it('shows podium plus only entries allowed by the live-ranking limit', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.podium-entry')).toHaveLength(3);
    expect(element.querySelectorAll('.ranking-table-wrap tbody tr')).toHaveLength(2);
    expect(element.textContent).toContain('Se muestran 5 de 6 participantes.');
  });

  it('never renders ranking actions', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('button')).toBeNull();
    expect(element.textContent).not.toContain('Editar');
    expect(element.textContent).not.toContain('Eliminar');
  });
});

function rankingGamification(): GamificationDetail {
  return {
    publicId: 'game-id', companyPublicId: 'company-id', title: 'Reto', description: '<p>Reto</p>', imageUrl: null,
    startAt: '2027-01-01T09:00:00.000Z', endAt: '2027-02-01T09:00:00.000Z', goal: '100.00', valuePrecision: 2,
    goalUnit: 'ventas', maxLiveRanking: 5, status: 'active', outcome: 'pending', createdAt: '2027-01-01', updatedAt: '2027-01-01',
    closedAt: null, prizes: [],
    ranking: [
      entry('one', 'Ana', 1, '50.00'), entry('two', 'Bea', 1, '50.00'), entry('three', 'Carla', 3, '25.00'),
      entry('four', 'Diego', 4, '20.00'), entry('five', 'Elena', 5, '15.00'), entry('six', 'Fran', 6, '10.00'),
    ],
  };
}

function entry(externalParticipantId: string, fullName: string, position: number, score: string) {
  return { externalParticipantId, fullName, position, score, createdAt: '2027-01-01', updatedAt: '2027-01-01' };
}
