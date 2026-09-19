export type GamificationStatus = 'draft' | 'active' | 'inactive' | 'closed';
export type GamificationOutcome = 'pending' | 'achieved' | 'missed' | 'not_applicable';

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
  maxLiveRanking: number;
  rankingFieldHeaders?: string[];
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
  participantCode: string;
  fullName: string;
  pictureUrl: string | null;
  position: number;
  score: string;
  customFields?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type GamificationDetail = Gamification & {
  prizes: Prize[];
  ranking: RankingEntry[];
  rules: GamificationRule[];
  blockOneCards: BlockOneCard[];
  blockTwoCards: BlockTwoCard[];
};

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
  maxLiveRanking?: number;
  rules?: GamificationRule[];
};

export type PrizePayload = {
  name: string;
  rankingPosition: number;
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
