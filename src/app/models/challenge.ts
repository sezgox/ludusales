export type Metric = { key: string; label: string; kind: 'sum' | 'latest' | 'max'; integer: boolean };
export type PointRule = { metric: string; label: string; rate: number; multiplier: number | null };
export type Minimum = { metric: string; operator: '>=' | '<='; value: number; label: string };
export type ImportMode = 'accumulated' | 'period';
export type MissionKind = 'first' | 'most' | 'all' | 'collective' | 'zones';
export type Mission = { id: string; title: string; description: string; kind: MissionKind; metric: string; threshold: number; start: string; end: string; reward: number; featured: boolean };
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type BadgeRule = 'metric' | 'points' | 'streak' | 'position' | 'climb' | 'minimums' | 'missions';
export type Badge = { id: string; title: string; description: string; rarity: BadgeRarity; points: number; rule: BadgeRule; metric: string; threshold: number; active: boolean };
export type Duel = { id: string; title: string; round: string; format: 'solo' | 'pairs'; left: string[]; right: string[]; leftFrom: string; rightFrom: string;
  metric: string; start: string; end: string; stake: string; useZone: boolean };
export type DuelResult = Pick<Duel, 'id' | 'title' | 'round' | 'start' | 'end' | 'stake' | 'format' | 'left' | 'right'> & {
  leftScore: number; rightScore: number; winner: 'left' | 'right' | null; status: 'upcoming' | 'active' | 'closed';
};
export type ChallengeMember = { id: number; code: string; fullName: string; zone: string; active: boolean };
export type TeamResult = { name: string; total: number; average: number; position: number; change: number | null; mvpCode: string; count: number };
export type MissionResult = { id: string; status: 'upcoming' | 'active' | 'closed'; progress: number; leaders: Array<{ key: string; value: number }>; winnerCount: number };
export type NewsItem = { text: string; priority: number; code?: string; badgeId?: string; missionId?: string };
export type ChallengeSettings = {
  metrics: Metric[]; rules: PointRule[]; minimums: Minimum[]; tieBreakers: string[];
  streak: { length: number; points: number } | null;
  goalMetric: string | null; missions: Mission[]; badges: Badge[]; duels: Duel[]; mode: ImportMode;
  columns: Record<string, string>; showTeams: boolean; showDuels: boolean; showPhotos: boolean;
  anonymousFrom: number | null; hiddenMetrics: string[]; tvInterval: number; tvLimit: number; updateDays: number[];
};
export type ChallengeInfo = Pick<ChallengeSettings, 'rules' | 'minimums' | 'tieBreakers' | 'missions' | 'badges' | 'showTeams' | 'showDuels' | 'tvInterval' | 'tvLimit' | 'updateDays'> & {
  metrics: Array<Pick<Metric, 'key' | 'label'>>;
  projection: { dataDate: string; goalTotal: number; teams: TeamResult[]; missions: MissionResult[]; duels: DuelResult[]; news: NewsItem[] } | null;
};
export type Calculation = { weekPoints: number; distance: number | null; streak: number; eligible: boolean; minimumsMissing: string[]; breakdown: Array<{ label: string; points: number }>; badgeIds: string[] };
export type MasterSheet = { sourceName: string; sourceHash: string; headers: string[]; rows: Array<Record<string, string | number>> };
export type MasterInput = MasterSheet & { mode: ImportMode; allowDecreases: boolean };
export type MasterPreview = { previewToken: string; entries: Array<{ code: string; fullName: string; score: number; position: number; eligible: boolean; minimumsMissing: string[] }>; projection: { news: NewsItem[] }; warnings: string[] };
export type TvDisplay = { title: string; rankingUnit: string; valuePrecision: number; updatedAt: string | null; seconds: number;
  ranking: Array<{ position: number; score: number; name: string }>; goal: number | null; goalUnit: string | null; goalTotal: number;
  teams: Array<{ name: string; average: number }>; news: string[] };
export type ChallengeHistory = { podiums: Record<string, Array<{ name: string; position: number; score: number }>>;
  records: Array<{ title: string; name: string; challenge: string; value: number; unit: string }> };

export const missionLabels: Record<MissionKind, string> = {
  first: 'El primero en llegar', most: 'Quien más consiga', all: 'Para todos los que lo logren', collective: 'Entre todos', zones: 'Por zonas',
};
export const rarityLabels: Record<BadgeRarity, string> = { common: 'Común', rare: 'Rara', epic: 'Épica', legendary: 'Legendaria' };
