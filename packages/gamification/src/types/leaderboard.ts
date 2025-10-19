// Leaderboard and Competition system types
export interface LeaderboardEntry {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  walletAddress: string;

  // Scores
  totalPoints: number;
  currentLevel: number;
  rank: number;

  // Statistics
  projectsApplied: number;
  projectsApproved: number;
  totalInvested: number;
  achievementsUnlocked: number;

  // Social
  communityContributions: number;
  referralsCount: number;

  // Timestamps
  lastActivity: Date;
  joinedAt: Date;
}

export interface Leaderboard {
  id: string;
  name: string;
  description: string;
  type: LeaderboardType;
  period: LeaderboardPeriod;
  isActive: boolean;

  // Configuration
  maxEntries: number;
  refreshInterval: number; // in seconds
  lastRefresh: Date;

  // Filters
  category?: string;
  minLevel?: number;
  minPoints?: number;

  // Metadata
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRank {
  userId: string;
  currentRank: number;
  previousRank?: number;
  rankChange: number;
  percentile: number; // Top X% of users
  trend: RankTrend;
}

export enum LeaderboardType {
  GLOBAL = 'global',              // All users
  CATEGORY = 'category',          // By category (projects, investments, etc.)
  TIME_BASED = 'time_based',      // Weekly, monthly, etc.
  ACHIEVEMENT = 'achievement',    // Achievement-based
  SOCIAL = 'social',             // Community contributions
  INVESTOR = 'investor'          // Investment-focused
}

export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  ALL_TIME = 'all_time'
}

export enum RankTrend {
  UP = 'up',
  DOWN = 'down',
  SAME = 'same',
  NEW = 'new'
}

// Predefined leaderboards for tokenization platform
export const TOKENIZATION_LEADERBOARDS: Leaderboard[] = [
  {
    id: 'global_all_time',
    name: 'Tabla Global',
    description: 'Usuarios más activos de todos los tiempos',
    type: LeaderboardType.GLOBAL,
    period: LeaderboardPeriod.ALL_TIME,
    isActive: true,
    maxEntries: 100,
    refreshInterval: 3600, // 1 hour
    lastRefresh: new Date(),
    tags: ['global', 'all-time'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'investors_monthly',
    name: 'Inversores del Mes',
    description: 'Mayores inversores del mes actual',
    type: LeaderboardType.INVESTOR,
    period: LeaderboardPeriod.MONTHLY,
    isActive: true,
    maxEntries: 50,
    refreshInterval: 86400, // 24 hours
    lastRefresh: new Date(),
    tags: ['investors', 'monthly'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'community_weekly',
    name: 'Constructores de Comunidad',
    description: 'Mayores contribuyentes a la comunidad esta semana',
    type: LeaderboardType.SOCIAL,
    period: LeaderboardPeriod.WEEKLY,
    isActive: true,
    maxEntries: 25,
    refreshInterval: 3600, // 1 hour
    lastRefresh: new Date(),
    tags: ['community', 'weekly'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];