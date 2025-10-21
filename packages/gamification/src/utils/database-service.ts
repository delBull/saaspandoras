import type {
  UserGamificationProfile,
  UserAchievement,
  Reward,
  LeaderboardEntry,
  UserPoints,
  GamificationEvent,
  EventType,
  PointsCategory
} from '../types';

// Database service that works with direct database access
export class DatabaseService {
  constructor() {
    // Direct database access - no HTTP calls needed
  }

  /**
   * Get user gamification profile from database
   */
  async getUserProfile(userId: string): Promise<UserGamificationProfile | null> {
    try {
      // For now, return null to avoid conflicts with dashboard service
      // The dashboard service will handle database operations directly
      console.log(`🔍 DatabaseService: Profile request for user ${userId} - handled by dashboard service`);
      return null;
    } catch (error) {
      console.error('Error in database service:', error);
      return null;
    }
  }

  /**
   * Track gamification event - handled by dashboard service
   */
  async trackEvent(userId: string, eventType: EventType, metadata?: Record<string, unknown>): Promise<GamificationEvent> {
    console.log(`🎯 DatabaseService: Event tracking handled by dashboard service for user ${userId}`);
    throw new Error('Event tracking should be handled by dashboard service');
  }

  /**
   * Award points - handled by dashboard service
   */
  async awardPoints(
    userId: string,
    points: number,
    reason: string,
    category: PointsCategory,
    metadata?: Record<string, unknown>
  ): Promise<UserPoints> {
    console.log(`💎 DatabaseService: Points awarding handled by dashboard service for user ${userId}`);
    throw new Error('Points awarding should be handled by dashboard service');
  }

  /**
   * Get user achievements - handled by dashboard service
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    console.log(`🏆 DatabaseService: Achievements fetching handled by dashboard service for user ${userId}`);
    return [];
  }

  /**
   * Get available rewards - handled by dashboard service
   */
  async getAvailableRewards(userId: string): Promise<Reward[]> {
    console.log(`🎁 DatabaseService: Rewards fetching handled by dashboard service for user ${userId}`);
    return [];
  }

  /**
   * Get leaderboard - handled by dashboard service
   */
  async getLeaderboard(type: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    console.log(`🏅 DatabaseService: Leaderboard fetching handled by dashboard service`);
    return [];
  }

  /**
   * Claim reward - handled by dashboard service
   */
  async claimReward(userId: string, rewardId: string): Promise<any> {
    console.log(`🎁 DatabaseService: Reward claiming handled by dashboard service for user ${userId}`);
    throw new Error('Reward claiming should be handled by dashboard service');
  }
}