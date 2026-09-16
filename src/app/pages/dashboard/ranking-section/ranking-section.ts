import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GamificationDetail, RankingEntry } from '../../../models/gamification';

@Component({
  selector: 'app-ranking-section',
  templateUrl: './ranking-section.html',
  styleUrl: './ranking-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingSection {
  readonly gamification = input.required<GamificationDetail>();
  readonly visibleEntries = computed(() => this.gamification().ranking.slice(0, this.gamification().maxLiveRanking));
  readonly hiddenEntries = computed(() => this.gamification().ranking.length - this.visibleEntries().length);

  readonly maximumScore = computed(() => Math.max(...this.visibleEntries().map((entry) => Number(entry.score)), 0));

  barWidth(entry: RankingEntry): number {
    const maximumScore = this.maximumScore();
    return maximumScore ? Math.max(4, (Number(entry.score) / maximumScore) * 100) : 100;
  }

  initials(fullName: string): string {
    return fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('es-ES');
  }
}
