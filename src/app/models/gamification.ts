export type GamificationStatus = 'draft' | 'active' | 'inactive' | 'closed';
export type GamificationOutcome = 'pending' | 'achieved' | 'missed';

export type Gamification = {
  publicId: string;
  companyPublicId: string;
  title: string;
  description: string;
  imageUrl: string | null;
  startAt: string;
  endAt: string;
  goal: string;
  valuePrecision: number;
  goalUnit: string;
  maxLiveRanking: number;
  status: GamificationStatus;
  outcome: GamificationOutcome;
  createdAt: string;
  updatedAt: string;
  actualEndAt?: string | null;
  /** @deprecated Use actualEndAt. Kept while older API responses are supported. */
  closedAt?: string | null;
};

export type Prize = {
  publicId: string;
  name: string;
  pictureUrl: string | null;
  sortOrder: number;
  rankingPosition: number;
  estimatedValue: number | null;
  createdAt: string;
  updatedAt: string;
};

export type RankingEntry = {
  externalParticipantId: string;
  fullName: string;
  pictureUrl: string | null;
  position: number;
  score: string;
  createdAt: string;
  updatedAt: string;
};

export type GamificationDetail = Gamification & {
  prizes: Prize[];
  ranking: RankingEntry[];
};

export type GamificationPayload = {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  goal: string;
  valuePrecision: number;
  goalUnit: string;
  maxLiveRanking?: number;
};

export type PrizePayload = {
  name: string;
  rankingPosition: number;
  estimatedValue: number | null;
};

export type RankingPayload = {
  fullName: string;
  score: string;
};
