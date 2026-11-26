import type { Calculation, ChallengeInfo } from './challenge';

export type GamificationStatus = 'draft' | 'active' | 'inactive' | 'closed';
export type GamificationOutcome = 'pending' | 'achieved' | 'missed' | 'not_applicable';
export const defaultRankingUnit = 'Ludu Points';

export type Gamification = {
  publicId: string;
  companyPublicId: string;
  title: string;
  description: string;
  imageUrl: string | null;
  startAt: string;
  endAt: string;
  goal: string | null;
  valuePrecision: number;
  goalUnit: string | null;
  rankingUnit: string;
  maxLiveRanking: number;
  tvEnabled?: boolean;
  rankingFieldHeaders?: string[];
  status: GamificationStatus;
  outcome: GamificationOutcome;
  createdAt: string;
  updatedAt: string;
  actualEndAt?: string | null;
  /** @deprecated Use actualEndAt. Kept while older API responses are supported. */
  closedAt?: string | null;
};

export type PrizeKind = 'position' | 'milestone' | 'zone' | 'special' | 'raffle';
export const prizeLabels: Record<PrizeKind, string> = { position: 'Por puesto', milestone: 'Por hito', zone: 'Por zona', special: 'Especial', raffle: 'Sorteo' };

export type Prize = {
  publicId: string;
  name: string;
  pictureUrl: string | null;
  sortOrder: number;
  rankingPosition: number | null;
  kind?: PrizeKind;
  description?: string;
  parameter?: string;
  winners?: string[];
  estimatedValue: number | null;
  createdAt: string;
  updatedAt: string;
};

export type RankingEntry = {
  participantCode: string;
  fullName: string;
  pictureUrl: string | null;
  position: number;
  score: string;
  positionChange?: number | null;
  scoreChange?: string | null;
  calculation?: Calculation | null;
  customFields?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type GamificationDetail = Gamification & {
  prizes: Prize[];
  ranking: RankingEntry[];
  rankingTotal?: string;
  rankingPublishedAt?: string | null;
  challengeInfo?: ChallengeInfo | null;
  rules: GamificationRule[];
  blockOneCards: BlockOneCard[];
  blockTwoCards: BlockTwoCard[];
};

export type RankingHistoryPoint = { publicId: string; publishedAt: string; position: number; score: string; valuePrecision: number };
export type RankingPublication = { publicId: string; publishedAt: string; status: 'published' | 'reverted'; sourceName?: string | null; hasWorkbook?: boolean };

export type BlockOneCard = {
  publicId: string;
  title: string;
  iconName: string;
  value: string;
  subvalue: string | null;
  progressCurrent: string | null;
  progressMax: string | null;
  sortOrder: number;
};

export type BlockTwoCard = {
  publicId: string;
  imagePublicId: string;
  imageUrl: string;
  title: string;
  description: string;
  sortOrder: number;
};

export type BlockImage = { publicId: string; imageUrl: string; createdAt: string };

export type BlockOneCardPayload = {
  title: string;
  iconName: string;
  value: string;
  subvalue: string | null;
  hasProgress: boolean;
  currentValue?: string;
  maxValue?: string;
};

export type BlockTwoCardPayload = { imagePublicId: string; title: string; description: string };

export type GamificationRule = {
  position: number;
  title: string;
  description: string;
  iconName: string;
};

export type GamificationPayload = {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  goal: string | null;
  valuePrecision: number;
  goalUnit: string | null;
  rankingUnit: string;
  maxLiveRanking?: number;
  tvEnabled?: boolean;
  rules?: GamificationRule[];
};

export type PrizePayload = {
  name: string;
  rankingPosition: number | null;
  kind?: PrizeKind;
  description?: string;
  parameter?: string;
  estimatedValue: number | null;
};

export type RankingPayload = {
  fullName: string;
  score: string;
  customFields?: Record<string, string>;
  fieldHeaders?: string[];
  previousParticipantCode?: string;
};

export type RankingReplacementEntry = {
  participantCode: string;
  fullName: string;
  score: string;
  customFields?: Record<string, string>;
};
