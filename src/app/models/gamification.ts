export type GamificationStatus = 'draft' | 'active' | 'closed';
export type GamificationOutcome = 'pending' | 'achieved' | 'missed';

export type Gamification = {
  publicId: string;
  companyPublicId: string;
  description: string;
  imageUrl: string | null;
  startAt: string;
  endAt: string;
  goal: string;
  valuePrecision: number;
  goalUnit: string;
  status: GamificationStatus;
  outcome: GamificationOutcome;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

export type Prize = {
  publicId: string;
  name: string;
  pictureUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type RankingEntry = {
  externalParticipantId: string;
  fullName: string;
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
  description: string;
  startAt: string;
  endAt: string;
  goal: string;
  valuePrecision: number;
  goalUnit: string;
};

export type RankingPayload = {
  fullName: string;
  score: string;
};
