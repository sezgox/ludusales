import { CurrencyPipe, DatePipe, DecimalPipe, DOCUMENT, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAward, LucideBookOpen, LucideDynamicIcon, LucideEllipsis, LucideGift, LucideHistory, LucideHouse, LucideLogOut, LucideSwords, LucideTarget, LucideTrophy, LucideUsers, provideLucideIcons } from '@lucide/angular';
import { catchError, distinctUntilChanged, firstValueFrom, map, of, startWith, switchMap, timer } from 'rxjs';
import { prizeLabels, type Prize, type RankingEntry, type RankingHistoryPoint } from '../../models/gamification';
import { missionLabels, rarityLabels } from '../../models/challenge';
import type { Badge, BadgeRarity, Mission, MissionKind } from '../../models/challenge';
import { AuthService } from '../../services/auth.service';
import { ChallengeDataService } from '../../services/challenge-data.service';
import { GamificationApiService } from '../../services/gamification-api.service';
import { GamificationStore } from '../../services/gamification.store';

const millisecondsPerDay = 86_400_000;
const tvViews = ['Clasificación', 'Meta y zonas', 'Novedades'] as const;
const navItems = [
  { path: 'inicio', title: 'Inicio', icon: 'house' },
  { path: 'ranking', title: 'Ranking', icon: 'trophy' },
  { path: 'misiones', title: 'Misiones', icon: 'target' },
  { path: 'insignias', title: 'Insignias', icon: 'award' },
  { path: 'equipos', title: 'Equipos', icon: 'users' },
  { path: 'enfrentamientos', title: 'Enfrentamientos', icon: 'swords' },
  { path: 'premios', title: 'Premios', icon: 'gift' },
  { path: 'reto', title: 'Reto y reglas', icon: 'book-open' },
  { path: 'historico', title: 'Histórico', icon: 'history' },
  { path: 'mas', title: 'Más', icon: 'ellipsis' },
] as const;
const mobilePaths = new Set(['inicio', 'ranking', 'misiones', 'insignias', 'mas']);

function searchKey(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es').trim();
}

type HistoryState = { status: 'ready'; points: RankingHistoryPoint[] } | { status: 'loading' | 'error' };

@Component({
  selector: 'app-challenge-portal',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, NgOptimizedImage, NgTemplateOutlet, RouterLink, LucideDynamicIcon],
  providers: [provideLucideIcons(LucideAward, LucideBookOpen, LucideEllipsis, LucideGift, LucideHistory, LucideHouse, LucideLogOut, LucideSwords, LucideTarget, LucideTrophy, LucideUsers)],
  templateUrl: './challenge-portal.html',
  styleUrl: './challenge-portal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengePortal {
  private readonly auth = inject(AuthService);
  private readonly api = inject(GamificationApiService);
  private readonly data = inject(ChallengeDataService);
  private readonly store = inject(GamificationStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  private readonly queryParams = toSignal(this.route.queryParamMap, { requireSync: true });
  private readonly now = toSignal(timer(0, 60_000).pipe(map(() => new Date())), { initialValue: new Date() });

  readonly company = this.auth.company;
  readonly mobilePaths = mobilePaths;
  readonly missionLabels = missionLabels;
  readonly rarityLabels = rarityLabels;
  readonly missionKinds = Object.keys(missionLabels) as MissionKind[];
  readonly rarities = Object.keys(rarityLabels) as BadgeRarity[];
  readonly section = this.route.snapshot.data['section'] as typeof navItems[number]['path'] | 'ficha' | 'tv';
  readonly gamifications = computed(() => this.store.gamifications().filter(({ status }) => status !== 'draft'));
  readonly completed = computed(() => this.gamifications().filter(({ status }) => status === 'closed' || status === 'inactive'));
  readonly selectedId = computed(() => {
    const requested = this.queryParams().get('gamification');
    const available = this.gamifications();
    if (requested && available.some((challenge) => challenge.publicId === requested)) return requested;
    return available.find((challenge) => challenge.status === 'active')?.publicId ?? null;
  });
  readonly query = computed(() => ({ gamification: this.selectedId() }));
  readonly challenge = computed(() => {
    const detail = this.store.selectedGamification();
    return detail?.publicId === this.selectedId() ? detail : null;
  });
  readonly error = this.store.feedback;
  readonly scoreDigits = computed(() => `1.0-${this.challenge()?.valuePrecision ?? 0}`);
  readonly loading = computed(() => {
    const company = this.company();
    return !!company && !this.error() && (!this.store.hasCompany(company.public_id) || (this.selectedId() && !this.challenge()));
  });
  readonly search = signal('');
  readonly selectedZone = signal('');
  readonly rankingView = signal<'individual' | 'zones' | 'improved'>('individual');
  readonly weekly = signal(false);
  readonly missionFilter = signal<MissionKind | ''>('');
  readonly badgeFilter = signal<BadgeRarity | ''>('');
  readonly badgeDetail = signal<Badge | null>(null);
  readonly simulator = signal<Record<string, number>>({});
  readonly info = computed(() => this.challenge()?.challengeInfo);
  readonly projection = computed(() => this.info()?.projection);
  readonly nav = computed(() => navItems.filter((item) => (item.path !== 'equipos' || this.info()?.showTeams) &&
    (item.path !== 'enfrentamientos' || this.info()?.showDuels)));
  readonly moreLinks = computed(() => this.nav().filter(({ path }) => !mobilePaths.has(path)));
  readonly calculatedGoal = computed(() => this.projection()?.goalTotal ?? Number(this.challenge()?.rankingTotal ?? 0));
  readonly ranking = computed(() => this.challenge()?.ranking ?? []);
  readonly zoneField = computed(() => this.challenge()?.rankingFieldHeaders?.find((field) => ['zona', 'zone'].includes(searchKey(field))));
  readonly zones = computed(() => {
    const field = this.zoneField();
    if (!field) return [];
    return Array.from(new Set(this.ranking().flatMap((entry) => entry.customFields?.[field] || []))).sort((a, b) => a.localeCompare(b, 'es'));
  });
  readonly filteredRanking = computed(() => {
    const query = searchKey(this.search());
    const zone = this.selectedZone();
    const field = this.zoneField();
    const rows = this.ranking().filter((entry) => searchKey(entry.fullName).includes(query) &&
      (!field || !zone || entry.customFields?.[field] === zone));
    if (this.rankingView() === 'improved') return rows.sort((a, b) => (b.scoreChange ? +b.scoreChange : 0) - (a.scoreChange ? +a.scoreChange : 0));
    return this.weekly() ? rows.sort((a, b) => (b.calculation?.weekPoints ?? 0) - (a.calculation?.weekPoints ?? 0)) : rows;
  });
  readonly podium = computed(() => this.ranking().slice(0, 3));
  readonly positionPrizes = computed(() => this.challenge()?.prizes.filter((prize) => (prize.kind ?? 'position') === 'position') ?? []);
  readonly extraPrizes = computed(() => this.challenge()?.prizes.filter((prize) => (prize.kind ?? 'position') !== 'position') ?? []);
  readonly eligibleCount = computed(() => this.ranking().filter(({ calculation }) => calculation?.eligible !== false).length);
  readonly highlights = computed(() => this.ranking().filter((entry) => (entry.positionChange ?? 0) > 0)
    .sort((left, right) => (right.positionChange ?? 0) - (left.positionChange ?? 0)).slice(0, 3));
  readonly missions = computed(() => (this.info()?.missions ?? []).filter(({ kind }) => !this.missionFilter() || kind === this.missionFilter()));
  readonly featuredMissions = computed(() => (this.info()?.missions ?? []).filter((mission) => mission.featured && this.missionResult(mission)?.status === 'active'));
  readonly badges = computed(() => (this.info()?.badges ?? []).filter((badge) => badge.active && (!this.badgeFilter() || badge.rarity === this.badgeFilter())));
  readonly unlockedBadges = computed(() => new Set(this.ranking().flatMap((entry) => entry.calculation?.badgeIds ?? [])));
  readonly ownBadges = computed(() => (this.info()?.badges ?? []).filter((badge) => this.participant()?.calculation?.badgeIds.includes(badge.id)));
  readonly simulatedPoints = computed(() => (this.info()?.rules ?? []).reduce((sum, rule) => sum +
    (this.simulator()[rule.metric] ?? 0) * rule.rate * (rule.multiplier === null ? 1 : rule.multiplier - 1), 0));
  readonly simulatorMetrics = computed(() => {
    const keys = new Set(this.info()?.rules.map(({ metric }) => metric));
    return this.info()?.metrics.filter(({ key }) => keys.has(key)) ?? [];
  });
  readonly participant = computed(() => this.ranking().find((entry) => entry.participantCode === this.params().get('participantCode')));
  readonly pointsToNext = computed(() => {
    const participant = this.participant();
    const ranking = this.ranking();
    if (!participant) return null;
    const target = ranking.filter((entry) => entry.position < participant.position).at(-1);
    if (!target) return null;
    const scale = 10 ** (this.challenge()?.valuePrecision ?? 0);
    const distance = Math.round(Number(target.score) * scale) - Math.round(Number(participant.score) * scale);
    return distance / scale;
  });
  readonly history = toSignal(toObservable(computed(() => {
    const company = this.company();
    const challenge = this.challenge();
    const participant = this.participant();
    return company && challenge && participant ? [company.public_id, challenge.publicId, participant.participantCode] as const : null;
  })).pipe(
    distinctUntilChanged((a, b) => a?.[0] === b?.[0] && a?.[1] === b?.[1] && a?.[2] === b?.[2]),
    switchMap((ids) => ids ? this.api.participantHistory(...ids).pipe(
      map((points): HistoryState => ({ status: 'ready', points })),
      catchError(() => of({ status: 'error' } as const)),
      startWith({ status: 'loading' } as const),
    ) : of(null)),
  ));
  readonly companyHistory = toSignal(toObservable(this.company).pipe(switchMap((company) =>
    company && this.section === 'historico' ? this.data.history(company.public_id).pipe(catchError(() => of(null))) : of(null),
  )));
  readonly positionChart = computed(() => {
    const history = this.history();
    if (history?.status !== 'ready' || history.points.length < 2) return null;
    const positions = history.points.map((point) => point.position);
    const spread = Math.max(1, Math.max(...positions) - 1);
    return positions.map((position, index) => `${10 + 580 * index / (positions.length - 1)},${10 + 80 * (position - 1) / spread}`).join(' ');
  });
  readonly daysLeft = computed(() => {
    const now = this.now();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const end = Date.parse(this.challenge()?.endAt.slice(0, 10) ?? '');
    return Math.max(0, (end - today) / millisecondsPerDay);
  });
  readonly timerLabel = computed(() => {
    if (this.challenge()?.status !== 'active') return 'Reto finalizado';
    const days = this.daysLeft();
    return days > 1 ? `Quedan ${days} días` : (days === 1 ? 'Queda 1 día' : 'Termina hoy');
  });
  readonly goalPercentage = computed(() => {
    const challenge = this.challenge();
    const goal = Number(challenge?.goal);
    return goal > 0 ? Math.round(this.calculatedGoal() * 100 / goal) : 0;
  });
  readonly goalBar = computed(() => Math.min(100, this.goalPercentage()));
  readonly nextUpdate = computed(() => {
    const challenge = this.challenge();
    const days = this.info()?.updateDays ?? [];
    if (challenge?.status !== 'active' || !days.length) return null;
    const base = this.now();
    const end = new Date(challenge.endAt + 'T23:59:59');
    const publication = challenge.rankingPublishedAt ? new Date(challenge.rankingPublishedAt) : null;
    const publishedToday = publication?.toDateString() === base.toDateString();
    for (let offset = publishedToday ? 1 : 0; offset <= 7; offset += 1) {
      const candidate = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
      if (candidate <= end && days.includes(candidate.getDay() || 7)) return candidate;
    }
    return null;
  });
  readonly tvAvailable = computed(() => this.challenge()?.status === 'active' && this.challenge()?.tvEnabled === true);
  readonly tvMode = computed(() => this.section === 'tv' && this.tvAvailable());
  readonly tvSlide = signal(0);
  readonly tvPaused = signal(false);
  readonly tvTitle = computed(() => tvViews[this.tvSlide()]);
  readonly tvRanking = computed(() => this.ranking().slice(0, this.info()?.tvLimit ?? 10));
  readonly fullscreenError = signal(false);
  readonly sessionError = signal(false);

  constructor() {
    effect(() => {
      const companyId = this.company()?.public_id;
      this.store.selectCompany(companyId ?? null);
      if (companyId) untracked(() => { void this.store.ensureCompany(companyId); });
    });
    effect(() => {
      const companyId = this.company()?.public_id;
      const selectedId = this.selectedId();
      if (!companyId) return;
      untracked(() => {
        this.store.selectGamification(selectedId);
        if (selectedId) void this.store.ensureDetail(companyId, selectedId, true);
      });
    });
    effect((onCleanup) => {
      const enabled = this.tvMode();
      const paused = this.tvPaused();
      if (!enabled) return;
      const refresh = globalThis.setInterval(() => this.refresh(), 30_000);
      const interval = (this.info()?.tvInterval ?? 9) * 1000;
      const rotation = paused ? null : globalThis.setInterval(() => this.advanceTv(), interval);
      onCleanup(() => {
        globalThis.clearInterval(refresh);
        if (rotation !== null) globalThis.clearInterval(rotation);
      });
    });
  }

  initials(entry: RankingEntry): string {
    return entry.fullName.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toLocaleUpperCase('es');
  }

  refresh(): void {
    const companyId = this.company()?.public_id;
    const selectedId = this.selectedId();
    if (companyId) void this.store.ensureCompany(companyId, true);
    if (companyId && selectedId) void this.store.ensureDetail(companyId, selectedId, true);
  }

  advanceTv(): void {
    this.tvSlide.update((slide) => (slide + 1) % tvViews.length);
  }

  previousTv(): void { this.tvSlide.update((slide) => (slide + tvViews.length - 1) % tvViews.length); }

  missionResult(mission: Mission) { return this.projection()?.missions.find(({ id }) => id === mission.id); }
  missionKindLabel(mission: Mission): string { return missionLabels[mission.kind]; }

  prizeLabel(prize: Prize): string {
    if (prize.rankingPosition) return `${prize.rankingPosition}.º puesto`;
    return prizeLabels[prize.kind ?? 'position'];
  }

  prizeCandidate(prize: Prize): RankingEntry | undefined {
    return prize.rankingPosition === null ? undefined : this.ranking().find(({ position, calculation }) =>
      position === prize.rankingPosition && calculation?.eligible !== false);
  }

  teamMvp(code: string): RankingEntry | undefined {
    return this.ranking().find(({ participantCode }) => participantCode === code);
  }

  participantsWithBadge(badge: Badge) { return this.ranking().filter((entry) => entry.calculation?.badgeIds.includes(badge.id)); }

  showBadge(badge: Badge, dialog: HTMLDialogElement): void {
    this.badgeDetail.set(badge);
    dialog.showModal();
  }

  setRankingView(value: string): void {
    if (value === 'individual' || value === 'zones' || value === 'improved') this.rankingView.set(value);
  }

  setSimulator(metric: string, input: HTMLInputElement): void {
    this.simulator.update((values) => ({ ...values, [metric]: Number.isFinite(input.valueAsNumber) ? Math.max(0, input.valueAsNumber) : 0 }));
  }

  async shareBadge(badge: Badge, entry: RankingEntry): Promise<void> {
    const content = `${entry.fullName} consiguió «${badge.title}» en ${this.challenge()?.title}.`;
    if (typeof navigator.share === 'function') {
      await navigator.share({ text: content }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(content).catch(() => undefined);
    }
  }

  async toggleFullscreen(target: HTMLElement): Promise<void> {
    this.fullscreenError.set(false);
    try {
      if (this.document.fullscreenElement) await this.document.exitFullscreen();
      else await target.requestFullscreen();
    } catch {
      this.fullscreenError.set(true);
    }
  }

  async logout(): Promise<void> {
    this.sessionError.set(false);
    try {
      await firstValueFrom(this.auth.logout());
      await this.router.navigateByUrl('/login');
    } catch {
      this.sessionError.set(true);
    }
  }
}
