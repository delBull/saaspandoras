"use server";

import type {
  UserGamificationProfile,
  UserAchievement,
  Reward,
  LeaderboardEntry,
  UserPoints,
  GamificationEvent,
  EventType,
  PointsCategory
} from '@pandoras/gamification';
import { GamificationEngine } from '@pandoras/gamification';
import { db } from '@/db';
import {
  gamificationProfiles,
  gamificationEvents,
  userPoints,
  achievements,
  rewards,
  type GamificationProfile as DrizzleGamificationProfile
} from '@/db/schema';
import { eq } from 'drizzle-orm';

class GamificationService {
  private static engine: GamificationEngine;
  // private static dbService: DatabaseService; // Commented out - using direct DB access instead

  constructor() {
    if (!GamificationService.engine) {
      GamificationService.engine = GamificationEngine.getInstance();
      // GamificationService.dbService = new DatabaseService(); // Commented out - using direct DB access instead
    }
  }

  /**
   * Get user gamification profile using real database
   */
  static async getUserProfile(userId: string): Promise<UserGamificationProfile | null> {
    console.log(`🔍 GamificationService: Getting profile for user ${userId}`);
    try {
      // For demo purposes, use the userId as string to match User table structure
      const userIdString = userId;

      const dbProfile = await db
        .select()
        .from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, userIdString))
        .limit(1);

      if (dbProfile.length > 0 && dbProfile[0]) {
        const profile = this.mapDbProfileToGamificationProfile(dbProfile[0]);
        console.log(`✅ Profile found: Level ${profile.currentLevel}, ${profile.totalPoints} points`);
        return profile;
      }

      // Create new profile if doesn't exist
      console.log(`🆕 Creating new profile for user ${userId}`);
      const newProfile = await this.createUserProfileInDb(userId);
      return newProfile;
    } catch (error) {
      console.error(`❌ Error getting profile for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Create new user profile in database
   */
  private static async createUserProfileInDb(userId: string): Promise<UserGamificationProfile> {
    // For demo purposes, use the userId as string to match User table structure

    const newDbProfile = {
      userId: userId,
      walletAddress: userId,
      totalPoints: 0,
      currentLevel: 1,
      levelProgress: 0,
      pointsToNextLevel: 100,
      projectsApplied: 0,
      projectsApproved: 0,
      totalInvested: "0.00",
      communityContributions: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      referralsCount: 0,
      communityRank: 0,
      reputationScore: 0,
      lastActivityDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const inserted = await db.insert(gamificationProfiles).values(newDbProfile).returning();
      if (inserted[0]) {
        return this.mapDbProfileToGamificationProfile(inserted[0]);
      }
      throw new Error('Failed to create profile - no data returned');
    } catch (error) {
      console.error(`❌ Error creating profile for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Map database profile to gamification profile
   */
  private static mapDbProfileToGamificationProfile(dbProfile: DrizzleGamificationProfile): UserGamificationProfile {
    return {
      id: dbProfile.id.toString(),
      userId: dbProfile.userId.toString(), // Convert number to string for frontend
      walletAddress: dbProfile.walletAddress,
      totalPoints: dbProfile.totalPoints,
      currentLevel: dbProfile.currentLevel,
      levelProgress: dbProfile.levelProgress,
      pointsToNextLevel: dbProfile.pointsToNextLevel,
      projectsApplied: dbProfile.projectsApplied,
      projectsApproved: dbProfile.projectsApproved,
      totalInvested: Number(dbProfile.totalInvested),
      communityContributions: dbProfile.communityContributions,
      currentStreak: dbProfile.currentStreak,
      longestStreak: dbProfile.longestStreak,
      lastActivityDate: dbProfile.lastActivityDate,
      totalActiveDays: dbProfile.totalActiveDays,
      referralsCount: dbProfile.referralsCount,
      communityRank: dbProfile.communityRank,
      reputationScore: dbProfile.reputationScore,
      createdAt: dbProfile.createdAt,
      updatedAt: dbProfile.updatedAt
    };
  }

  /**
   * Track gamification event using real database
   */
  static async trackEvent(
    userId: string,
    eventType: string,
    metadata?: Record<string, unknown>
  ): Promise<GamificationEvent> {
    console.log(`🎯 GamificationService: Tracking event ${eventType} for user ${userId}`);
    try {
      // Get points for this event type
      const points = this.getEventPoints(eventType);

      // Create event in database
      const eventData = {
        userId: userId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        type: eventType as any, // Cast to match Drizzle enum
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        category: this.getEventCategory(eventType) as any, // Cast to match Drizzle enum
        points,
        metadata,
        createdAt: new Date()
      };

      const insertedEvent = await db.insert(gamificationEvents).values(eventData).returning();

      if (!insertedEvent[0]) {
        throw new Error('Failed to create event');
      }

      // Award points if event has points
      if (points > 0) {
        await this.awardPointsToDb(userId, points, `Event: ${eventType}`, this.getPointsCategory(eventType), metadata);
      }

      // Map to gamification event format
      const event: GamificationEvent = {
        id: insertedEvent[0].id.toString(),
        userId: insertedEvent[0].userId.toString(), // Convert number to string for frontend
        type: insertedEvent[0].type as EventType,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        category: insertedEvent[0].category as any,
        points: insertedEvent[0].points,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: insertedEvent[0].metadata as Record<string, any>,
        createdAt: insertedEvent[0].createdAt
      };

      console.log(`✅ Event tracked: +${event.points} points`);
      return event;
    } catch (error) {
      console.error(`❌ Error tracking event for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Award points using real engine
   */
  static async awardPoints(
    userId: string,
    points: number,
    reason: string,
    category: string,
    metadata?: Record<string, unknown>
  ): Promise<UserPoints> {
    console.log(`💎 GamificationService: Awarding ${points} points to user ${userId} for ${reason}`);
    try {
      const pointsRecord = await GamificationService.engine.awardPoints(
        userId,
        points,
        reason,
        category as PointsCategory,
        metadata
      );
      console.log(`✅ Points awarded:`, pointsRecord);
      return pointsRecord;
    } catch (error) {
      console.error(`❌ Error awarding points to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user achievements using database
   */
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    console.log(`🏆 GamificationService: Getting achievements for user ${userId}`);
    try {
      // For now, return empty array - will be implemented with database
      await new Promise(resolve => setTimeout(resolve, 0)); // Dummy await
      return [];
    } catch (error) {
      console.error(`❌ Error getting achievements for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get leaderboard data using database
   */
  static async getLeaderboard(type: string, limit = 10): Promise<LeaderboardEntry[]> {
    console.log(`🏅 GamificationService: Getting leaderboard ${type}, limit ${limit}`);
    try {
      // For now, return empty array - will be implemented with database
      await new Promise(resolve => setTimeout(resolve, 0)); // Dummy await
      return [];
    } catch (error) {
      console.error(`❌ Error getting leaderboard:`, error);
      return [];
    }
  }

  /**
   * Get available rewards for user using database
   */
  static async getAvailableRewards(userId: string): Promise<Reward[]> {
    console.log(`🎁 GamificationService: Getting available rewards for user ${userId}`);
    try {
      // For now, return empty array - will be implemented with database
      await new Promise(resolve => setTimeout(resolve, 0)); // Dummy await
      return [];
    } catch (error) {
      console.error(`❌ Error getting rewards for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get singleton instances for external use
   */
  static getEngine(): GamificationEngine {
    return GamificationService.engine;
  }
// static getDatabaseService(): DatabaseService { // Commented out - using direct DB access instead
//   return GamificationService.dbService;
// }

/**
 * Get event points based on event type
 */
private static getEventPoints(eventType: string): number {
  const pointsMap: Record<string, number> = {
    'project_application_submitted': 50,
    'project_application_approved': 100,
    'investment_made': 25,
    'daily_login': 10,
    'user_registered': 20,
    'referral_made': 200
  };

  return pointsMap[eventType] ?? 0;
}

/**
 * Get event category from event type
 */
private static getEventCategory(eventType: string): string {
  const categoryMap: Record<string, string> = {
    'project_application_submitted': 'projects',
    'project_application_approved': 'projects',
    'investment_made': 'investments',
    'user_registered': 'community',
    'daily_login': 'daily'
  };

  return categoryMap[eventType] ?? 'special';
}

/**
 * Get points category from event type
 */
private static getPointsCategory(eventType: string): string {
  const categoryMap: Record<string, string> = {
    'project_application_submitted': 'project_application',
    'project_application_approved': 'project_application',
    'investment_made': 'investment',
    'daily_login': 'daily_login'
  };

  return categoryMap[eventType] ?? 'special_event';
}

/**
 * Award points to database
 */
private static async awardPointsToDb(
  userId: string,
  points: number,
  reason: string,
  category: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // For demo purposes, use the userId as string to match User table structure

    // Insert points record
    await db.insert(userPoints).values({
      userId: userId,
      points,
      reason,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      category: category as any,
      metadata,
      createdAt: new Date()
    });

    // Update user profile
    await this.updateUserProfilePoints(userId, points);
  } catch (error) {
    console.error(`❌ Error awarding points to database for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Update user profile points in database
 */
private static async updateUserProfilePoints(userId: string, pointsToAdd: number): Promise<void> {
  try {
    console.log(`💾 Updating profile points for user ${userId}: +${pointsToAdd} points`);

    // For demo purposes, use the userId as string to match User table structure

    // Get current profile
    const currentProfile = await db
      .select()
      .from(gamificationProfiles)
      .where(eq(gamificationProfiles.userId, userId))
      .limit(1);

    if (!currentProfile[0]) {
      console.error(`❌ Profile not found for user ${userId}`);
      throw new Error('Profile not found');
    }

    const oldLevel = currentProfile[0].currentLevel;
    const newTotalPoints = currentProfile[0].totalPoints + pointsToAdd;
    const newLevel = Math.floor(newTotalPoints / 100) + 1;
    const newLevelProgress = newTotalPoints % 100;

    console.log(`📊 Profile update: ${currentProfile[0].totalPoints} → ${newTotalPoints} points, Level ${oldLevel} → ${newLevel}`);

    // Update profile
    await db
      .update(gamificationProfiles)
      .set({
        totalPoints: newTotalPoints,
        currentLevel: newLevel,
        levelProgress: newLevelProgress,
        pointsToNextLevel: 100 - newLevelProgress,
        updatedAt: new Date()
      })
      .where(eq(gamificationProfiles.userId, userId));

    console.log(`✅ Profile updated successfully for user ${userId}`);

    // Check for level up
    if (newLevel > oldLevel) {
      console.log(`🎉 LEVEL UP! User ${userId} reached level ${newLevel}!`);
    }
  } catch (error) {
    console.error(`❌ Error updating profile points for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Validate system health and log status
 */
static async validateSystemHealth(): Promise<{
  isHealthy: boolean;
  databaseConnection: boolean;
  gamificationEngine: boolean;
  errors: string[];
}> {
  console.log(`🔍 Validating gamification system health...`);
  const errors: string[] = [];
  let databaseConnection = false;
  let gamificationEngine = false;

  try {
    // Test database connection
    await db.select().from(gamificationProfiles).limit(1);
    databaseConnection = true;
    console.log(`✅ Database connection: OK`);
  } catch (error) {
    errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`❌ Database connection: FAILED`, error);
  }

  try {
    // Test gamification engine
    const engine = GamificationEngine.getInstance();
    gamificationEngine = !!engine;
    console.log(`✅ Gamification engine: OK`);
  } catch (error) {
    errors.push(`Gamification engine failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`❌ Gamification engine: FAILED`, error);
  }

  const isHealthy = databaseConnection && gamificationEngine && errors.length === 0;

  console.log(`🏥 System health check complete: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
  if (errors.length > 0) {
    console.log(`🚨 Errors found:`, errors);
  }

  return {
    isHealthy,
    databaseConnection,
    gamificationEngine,
    errors
  };
}
}

// Export individual functions for API routes (using arrow functions to avoid 'this' issues)
export const getUserGamificationProfile = async (userId: string) => GamificationService.getUserProfile(userId);
export const trackGamificationEvent = async (userId: string, eventType: string, metadata?: Record<string, unknown>) =>
GamificationService.trackEvent(userId, eventType, metadata);
export const awardGamificationPoints = async (userId: string, points: number, reason: string, category: string, metadata?: Record<string, unknown>) =>
GamificationService.awardPoints(userId, points, reason, category, metadata);
export const getGamificationLeaderboard = async (type: string, limit?: number) => GamificationService.getLeaderboard(type, limit);
export const getUserGamificationAchievements = async (userId: string) => GamificationService.getUserAchievements(userId);
export const getAvailableGamificationRewards = async (userId: string) => GamificationService.getAvailableRewards(userId);

/**
 * Initialize gamification data with sample achievements and rewards
 */
export async function initializeGamificationData(): Promise<void> {
  console.log(`🚀 Initializing gamification data...`);

  try {
    // Insert sample achievements
    const sampleAchievements = [
      {
        name: "Primeros Pasos",
        description: "Completa tu primera aplicación de proyecto",
        icon: "🎯",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        type: "first_steps" as any,
        requiredPoints: 50,
        requiredLevel: 1,
        requiredEvents: JSON.stringify(["project_application_submitted"]),
        pointsReward: 25,
        badgeUrl: "/badges/first-steps.png",
        isActive: true,
        isSecret: false,
        createdAt: new Date()
      },
      {
        name: "Inversionista Activo",
        description: "Realiza tu primera inversión",
        icon: "💎",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        type: "investor" as any,
        requiredPoints: 100,
        requiredLevel: 2,
        requiredEvents: JSON.stringify(["investment_made"]),
        pointsReward: 50,
        badgeUrl: "/badges/investor.png",
        isActive: true,
        isSecret: false,
        createdAt: new Date()
      },
      {
        name: "Constructor de Comunidad",
        description: "Participa activamente en la comunidad",
        icon: "🌟",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        type: "community_builder" as any,
        requiredPoints: 200,
        requiredLevel: 3,
        requiredEvents: JSON.stringify(["community_post", "referral_made"]),
        pointsReward: 100,
        badgeUrl: "/badges/community-builder.png",
        isActive: true,
        isSecret: false,
        createdAt: new Date()
      }
    ];

    for (const achievement of sampleAchievements) {
      await db.insert(achievements).values(achievement).onConflictDoNothing();
    }

    // Insert sample rewards
    const sampleRewards = [
      {
        name: "Descuento Token 10%",
        description: "10% de descuento en tu próxima inversión",
        icon: "💰",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        type: "token_discount" as any,
        requiredPoints: 100,
        requiredLevel: 2,
        value: "10%",
        metadata: JSON.stringify({ discountType: "percentage", maxDiscount: 100 }),
        isActive: true,
        stock: null, // unlimited
        claimedCount: 0,
        createdAt: new Date()
      },
      {
        name: "Acceso Prioritario",
        description: "Acceso anticipado a nuevos proyectos",
        icon: "⚡",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        type: "priority_access" as any,
        requiredPoints: 250,
        requiredLevel: 3,
        value: "7 días",
        metadata: JSON.stringify({ accessType: "early", durationDays: 7 }),
        isActive: true,
        stock: 100,
        claimedCount: 0,
        createdAt: new Date()
      },
      {
        name: "NFT Exclusivo",
        description: "NFT conmemorativo de Pandora's Finance",
        icon: "🎨",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        type: "nft" as any,
        requiredPoints: 500,
        requiredLevel: 5,
        value: "1 NFT",
        metadata: JSON.stringify({ nftType: "commemorative", rarity: "rare" }),
        isActive: true,
        stock: 50,
        claimedCount: 0,
        createdAt: new Date()
      }
    ];

    for (const reward of sampleRewards) {
      await db.insert(rewards).values(reward).onConflictDoNothing();
    }

    console.log(`✅ Gamification data initialized successfully`);
  } catch (error) {
    console.error(`❌ Error initializing gamification data:`, error);
    throw error;
  }
}