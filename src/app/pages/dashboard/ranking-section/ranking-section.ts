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
  readonly podiumEntries = computed(() => this.visibleEntries().slice(0, 3));
  readonly remainingEntries = computed(() => this.visibleEntries().slice(3));
  readonly hiddenEntries = computed(() => this.gamification().ranking.length - this.visibleEntries().length);

  podiumEntry(index: number): RankingEntry | null { return this.podiumEntries()[index] ?? null; }
}
