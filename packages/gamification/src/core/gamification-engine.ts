import {
  UserGamificationProfile,
  UserPoints,
  PointsCategory,
  Achievement,
  UserAchievement,
  Reward,
  UserReward,
  GamificationEvent,
  EventType,
  EventCategory,
  LeaderboardEntry
} from '../types';
import { DatabaseService } from '../utils/database-service';

export class GamificationEngine {
  private static instance: GamificationEngine;
  private dbService: DatabaseService;

  constructor() {
    this.dbService = new DatabaseService();
  }

  public static getInstance(): GamificationEngine {
    if (!GamificationEngine.instance) {
      GamificationEngine.instance = new GamificationEngine();
    }
    return GamificationEngine.instance;
  }

  /**
   * Award points to a user
   */
  async awardPoints(
    userId: string,
    points: number,
    reason: string,
    category: PointsCategory,
    metadata?: Record<string, any>
  ): Promise<UserPoints> {
    console.log(`🎯 GamificationEngine: Awarding ${points} points to user ${userId} for ${reason}`);

    // Create points record
    const pointsRecord: UserPoints = {
      id: `points_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      points,
      reason,
      category,
      metadata,
      createdAt: new Date()
    };

    // Update user profile
    await this.updateUserPoints(userId, points);

    // Check for level up
    await this.checkLevelUp(userId);

    // Check for achievements
    await this.checkAchievements(userId);

    return pointsRecord;
  }

  /**
   * Track a gamification event
   */
  async trackEvent(
    userId: string,
    eventType: EventType,
    metadata?: Record<string, any>
  ): Promise<GamificationEvent> {
    console.log(`📊 GamificationEngine: Tracking event ${eventType} for user ${userId}`);

    // Ensure profile exists
    let profile = await this.dbService.getUserProfile(userId);
    if (!profile) {
      console.log(`👤 Creating new profile for ${userId}`);
      profile = await this.dbService.createUserProfile({
        id: `user_${Date.now()}`,
        userId,
        walletAddress: userId,
        totalPoints: 0,
        currentLevel: 1,
        pointsToNextLevel: 100,
        levelProgress: 0,
        projectsApplied: 0,
        projectsApproved: 0,
        totalInvested: 0,
        communityContributions: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date(),
        totalActiveDays: 1,
        referralsCount: 0,
        communityRank: 0,
        reputationScore: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const event: GamificationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: eventType,
      category: this.getEventCategory(eventType),
      points: this.getEventPoints(eventType) || (metadata?.completionBonus as number) || 0,
      metadata,
      createdAt: new Date()
    };

    // Award points for the event
    if (event.points > 0) {
      await this.awardPoints(
        userId,
        event.points,
        `Event: ${eventType}`,
        this.getPointsCategory(eventType)
      );
    }

    // Persist event in DB (if DatabaseService stores events)
    await this.dbService.trackEvent(userId, eventType, metadata);

    return event;
  }

  /**
   * Get user gamification profile
   */
  async getUserProfile(userId: string): Promise<UserGamificationProfile | null> {
    return await this.dbService.getUserProfile(userId);
  }

  /**
   * Update user points and profile
   */
  private async updateUserPoints(userId: string, pointsToAdd: number): Promise<void> {
    // Use the database service to update points
    await this.dbService.awardPoints(
      userId,
      pointsToAdd,
      'Points update',
      PointsCategory.SPECIAL_EVENT
    );
  }

  /**
   * Check if user leveled up
   */
  private async checkLevelUp(userId: string): Promise<void> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return;

    const newLevel = this.calculateLevel(profile.totalPoints + 100); // Assuming points were added
    if (newLevel > profile.currentLevel) {
      console.log(`🎉 User ${userId} leveled up to ${newLevel}!`);
      // Trigger level up events
    }
  }

  /**
   * Check for achievement unlocks
   */
  private async checkAchievements(userId: string): Promise<void> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return;

    // Check various achievements
    // This would check against all available achievements
    console.log(`🔍 Checking achievements for user ${userId}`);
  }

  /**
   * Calculate user level based on points
   */
  private calculateLevel(totalPoints: number): number {
    // Level calculation logic
    return Math.floor(totalPoints / 100) + 1;
  }

  /**
   * Get event category from event type
   */
  private getEventCategory(eventType: EventType): EventCategory {
    const categoryMap: Record<string, EventCategory> = {
      [EventType.PROJECT_APPLICATION_SUBMITTED]: EventCategory.PROJECTS,
      [EventType.PROJECT_APPLICATION_APPROVED]: EventCategory.PROJECTS,
      [EventType.INVESTMENT_MADE]: EventCategory.INVESTMENTS,
      [EventType.USER_REGISTERED]: EventCategory.COMMUNITY,
      [EventType.DAILY_LOGIN]: EventCategory.DAILY,
    };

    return categoryMap[eventType] || EventCategory.SPECIAL;
  }

  private getEventPoints(eventType: EventType): number {
    const pointsMap: Record<string, number> = {
      [EventType.PROJECT_APPLICATION_SUBMITTED]: 50,
      [EventType.PROJECT_APPLICATION_APPROVED]: 100,
      [EventType.INVESTMENT_MADE]: 25,
      [EventType.DAILY_LOGIN]: 10,
      [EventType.USER_REGISTERED]: 20,
      [EventType.COURSE_COMPLETED]: 100,
      [EventType.PROTOCOL_DEPLOYED]: 500,
    };

    return pointsMap[eventType] || 0;
  }

  /**
   * Get points category from event type
   */
  private getPointsCategory(eventType: EventType): PointsCategory {
    const categoryMap: Record<string, PointsCategory> = {
      [EventType.PROJECT_APPLICATION_SUBMITTED]: PointsCategory.PROJECT_APPLICATION,
      [EventType.PROJECT_APPLICATION_APPROVED]: PointsCategory.PROJECT_APPLICATION,
      [EventType.INVESTMENT_MADE]: PointsCategory.INVESTMENT,
      [EventType.DAILY_LOGIN]: PointsCategory.DAILY_LOGIN,
    };

    return categoryMap[eventType] || PointsCategory.SPECIAL_EVENT;
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(type: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    return await this.dbService.getLeaderboard(type, limit);
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await this.dbService.getUserAchievements(userId);
  }

  /**
   * Get available rewards for user
   */
  async getAvailableRewards(userId: string): Promise<Reward[]> {
    return await this.dbService.getAvailableRewards(userId);
  }
}