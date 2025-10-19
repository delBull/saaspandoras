// User gamification profile types
export interface UserGamificationProfile {
  id: string;
  userId: string;
  walletAddress: string;

  // Points and Level System
  totalPoints: number;
  currentLevel: number;
  pointsToNextLevel: number;
  levelProgress: number; // 0-100 percentage

  // Statistics
  projectsApplied: number;
  projectsApproved: number;
  totalInvested: number;
  communityContributions: number;

  // Streaks and Activity
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  totalActiveDays: number;

  // Social and Community
  referralsCount: number;
  communityRank: number;
  reputationScore: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface UserLevel {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
  color: string;
  benefits: string[];
  isActive: boolean;
}

export interface UserPoints {
  id: string;
  userId: string;
  points: number;
  reason: string;
  category: PointsCategory;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export enum PointsCategory {
  PROJECT_APPLICATION = 'project_application',
  PROJECT_APPROVAL = 'project_approval',
  INVESTMENT = 'investment',
  COMMUNITY_CONTRIBUTION = 'community_contribution',
  DAILY_LOGIN = 'daily_login',
  STREAK_BONUS = 'streak_bonus',
  REFERRAL = 'referral',
  EDUCATIONAL_CONTENT = 'educational_content',
  SPECIAL_EVENT = 'special_event'
}