import { UserPoints, PointsCategory, UserGamificationProfile } from '../types';

export class PointsManager {
  private static instance: PointsManager;

  public static getInstance(): PointsManager {
    if (!PointsManager.instance) {
      PointsManager.instance = new PointsManager();
    }
    return PointsManager.instance;
  }

  /**
   * Award points to user
   */
  async awardPoints(
    userId: string,
    points: number,
    reason: string,
    category: PointsCategory,
    metadata?: Record<string, any>
  ): Promise<UserPoints> {
    const pointsRecord: UserPoints = {
      id: `points_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      points,
      reason,
      category,
      metadata,
      createdAt: new Date()
    };

    console.log(`🎯 PointsManager: Awarded ${points} points to ${userId} for ${reason}`);

    // Update user profile
    await this.updateUserProfile(userId, points);

    return pointsRecord;
  }

  /**
   * Get points for specific activity
   */
  getPointsForActivity(activity: string): number {
    const pointsMap: Record<string, number> = {
      // Project activities
      'project_application_submitted': 50,
      'project_application_approved': 100,
      'project_rejected': -25,

      // Investment activities
      'investment_made': 25,
      'portfolio_milestone': 75,

      // Community activities
      'daily_login': 10,
      'referral_made': 200,
      'community_post': 15,

      // Learning activities
      'course_completed': 100,
      'quiz_passed': 25,

      // Special activities
      'beta_access': 500,
      'feature_unlock': 150
    };

    return pointsMap[activity] || 0;
  }

  /**
   * Calculate level based on total points
   */
  calculateLevel(totalPoints: number): { level: number; progress: number; pointsToNext: number } {
    const basePoints = 100; // Points needed for level 1
    const multiplier = 1.5; // Exponential growth

    let level = 1;
    let pointsNeeded = basePoints;
    let totalPointsForLevel = 0;

    // Calculate current level
    while (totalPoints >= totalPointsForLevel + pointsNeeded) {
      totalPointsForLevel += pointsNeeded;
      level++;
      pointsNeeded = Math.floor(pointsNeeded * multiplier);
    }

    const currentLevelPoints = totalPoints - totalPointsForLevel;
    const pointsToNextLevel = pointsNeeded - currentLevelPoints;

    return {
      level,
      progress: Math.round((currentLevelPoints / pointsNeeded) * 100),
      pointsToNext: pointsToNextLevel
    };
  }

  /**
   * Get level information
   */
  getLevelInfo(level: number): { name: string; color: string; benefits: string[] } {
    const levelInfo: Record<number, { name: string; color: string; benefits: string[] }> = {
      1: {
        name: 'Novato',
        color: 'bg-gray-500',
        benefits: ['Acceso básico', 'Soporte comunidad']
      },
      2: {
        name: 'Explorador',
        color: 'bg-blue-500',
        benefits: ['Acceso prioritario', 'Descuentos 5%']
      },
      3: {
        name: 'Constructor',
        color: 'bg-green-500',
        benefits: ['Acceso prioritario', 'Descuentos 10%', 'Soporte premium']
      },
      4: {
        name: 'Inversor',
        color: 'bg-purple-500',
        benefits: ['Acceso prioritario', 'Descuentos 15%', 'Soporte VIP']
      },
      5: {
        name: 'Elite',
        color: 'bg-yellow-500',
        benefits: ['Acceso prioritario', 'Descuentos 20%', 'Soporte VIP', 'Eventos exclusivos']
      }
    };

    return levelInfo[level] || levelInfo[1];
  }

  /**
   * Update user profile with new points
   */
  private async updateUserProfile(userId: string, pointsToAdd: number): Promise<void> {
    // This would update the database
    console.log(`💾 PointsManager: Updating profile for user ${userId} with +${pointsToAdd} points`);

    // Get current profile
    const currentProfile = await this.getUserProfile(userId);
    if (!currentProfile) return;

    // Calculate new level
    const newTotalPoints = currentProfile.totalPoints + pointsToAdd;
    const levelInfo = this.calculateLevel(newTotalPoints);

    // Update profile
    const updatedProfile: UserGamificationProfile = {
      ...currentProfile,
      totalPoints: newTotalPoints,
      currentLevel: levelInfo.level,
      pointsToNextLevel: levelInfo.pointsToNext,
      levelProgress: levelInfo.progress,
      updatedAt: new Date()
    };

    console.log(`📊 Profile updated: Level ${currentProfile.currentLevel} → ${levelInfo.level}`);
  }

  /**
   * Get user profile (mock implementation)
   */
  private async getUserProfile(userId: string): Promise<UserGamificationProfile | null> {
    // This would fetch from database
    return {
      id: `profile_${userId}`,
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
      totalActiveDays: 0,
      referralsCount: 0,
      communityRank: 0,
      reputationScore: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get points history for user
   */
  async getUserPointsHistory(userId: string, limit: number = 50): Promise<UserPoints[]> {
    // This would fetch from database
    console.log(`📊 Fetching points history for user ${userId}, limit: ${limit}`);
    return [];
  }

  /**
   * Get points by category for user
   */
  async getUserPointsByCategory(userId: string): Promise<Record<PointsCategory, number>> {
    // This would fetch from database and aggregate
    console.log(`📊 Fetching points by category for user ${userId}`);
    return {
      [PointsCategory.PROJECT_APPLICATION]: 0,
      [PointsCategory.PROJECT_APPROVAL]: 0,
      [PointsCategory.INVESTMENT]: 0,
      [PointsCategory.COMMUNITY_CONTRIBUTION]: 0,
      [PointsCategory.DAILY_LOGIN]: 0,
      [PointsCategory.STREAK_BONUS]: 0,
      [PointsCategory.REFERRAL]: 0,
      [PointsCategory.EDUCATIONAL_CONTENT]: 0,
      [PointsCategory.SPECIAL_EVENT]: 0
    };
  }
}