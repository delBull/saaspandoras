import {
  Achievement,
  UserAchievement,
  UserGamificationProfile,
  TOKENIZATION_ACHIEVEMENTS,
  AchievementCategory,
  AchievementRarity,
  RequirementType
} from '../types';

export class AchievementManager {
  private static instance: AchievementManager;

  public static getInstance(): AchievementManager {
    if (!AchievementManager.instance) {
      AchievementManager.instance = new AchievementManager();
    }
    return AchievementManager.instance;
  }

  /**
   * Get all available achievements
   */
  getAllAchievements(): Achievement[] {
    return TOKENIZATION_ACHIEVEMENTS;
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return TOKENIZATION_ACHIEVEMENTS.filter(achievement => achievement.category === category);
  }

  /**
   * Get achievements by rarity
   */
  getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
    return TOKENIZATION_ACHIEVEMENTS.filter(achievement => achievement.rarity === rarity);
  }

  /**
   * Check if user qualifies for achievement
   */
  checkAchievementEligibility(
    achievement: Achievement,
    userProfile: UserGamificationProfile
  ): { eligible: boolean; progress: number; currentValues: Record<string, number> } {
    const currentValues: Record<string, number> = {};

    for (const requirement of achievement.requirements) {
      const currentValue = this.getCurrentValueForRequirement(requirement, userProfile);
      currentValues[requirement.type] = currentValue;

      if (currentValue < requirement.target) {
        return {
          eligible: false,
          progress: Math.round((currentValue / requirement.target) * 100),
          currentValues
        };
      }
    }

    return {
      eligible: true,
      progress: 100,
      currentValues
    };
  }

  /**
   * Get current value for a requirement
   */
  private getCurrentValueForRequirement(
    requirement: any,
    userProfile: UserGamificationProfile
  ): number {
    switch (requirement.type) {
      case RequirementType.PROJECTS_APPLIED:
        return userProfile.projectsApplied;
      case RequirementType.PROJECTS_APPROVED:
        return userProfile.projectsApproved;
      case RequirementType.TOTAL_INVESTED:
        return userProfile.totalInvested;
      case RequirementType.DAILY_STREAK:
        return userProfile.currentStreak;
      case RequirementType.REFERRALS_MADE:
        return userProfile.referralsCount;
      case RequirementType.TOTAL_POINTS:
        return userProfile.totalPoints;
      default:
        return 0;
    }
  }

  /**
   * Process achievement unlock
   */
  async unlockAchievement(
    userId: string,
    achievementId: string
  ): Promise<UserAchievement> {
    const achievement = TOKENIZATION_ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) {
      throw new Error(`Achievement ${achievementId} not found`);
    }

    const userAchievement: UserAchievement = {
      id: `ua_${userId}_${achievementId}_${Date.now()}`,
      userId,
      achievementId,
      progress: 100,
      isCompleted: true,
      completedAt: new Date(),
      metadata: {
        rarity: achievement.rarity,
        category: achievement.category,
        points: achievement.points
      }
    };

    console.log(`🏆 Achievement unlocked: ${achievement.name} for user ${userId}`);

    return userAchievement;
  }

  /**
   * Get user achievements with progress
   */
  async getUserAchievementsWithProgress(userId: string): Promise<UserAchievement[]> {
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) return [];

    const achievements = this.getAllAchievements();
    const userAchievements: UserAchievement[] = [];

    for (const achievement of achievements) {
      const eligibility = this.checkAchievementEligibility(achievement, userProfile);

      const userAchievement: UserAchievement = {
        id: `ua_${userId}_${achievement.id}`,
        userId,
        achievementId: achievement.id,
        progress: eligibility.progress,
        isCompleted: eligibility.eligible,
        completedAt: eligibility.eligible ? new Date() : undefined,
        metadata: {
          category: achievement.category,
          rarity: achievement.rarity,
          points: achievement.points
        }
      };

      userAchievements.push(userAchievement);
    }

    return userAchievements;
  }

  /**
   * Get recently unlocked achievements
   */
  async getRecentAchievements(userId: string, limit: number = 5): Promise<UserAchievement[]> {
    // This would fetch from database
    console.log(`🏆 Fetching recent achievements for user ${userId}, limit: ${limit}`);
    return [];
  }

  /**
   * Get achievement statistics
   */
  async getAchievementStats(userId: string): Promise<{
    totalAchievements: number;
    completedAchievements: number;
    totalPointsFromAchievements: number;
    achievementsByCategory: Record<AchievementCategory, number>;
    achievementsByRarity: Record<AchievementRarity, number>;
  }> {
    const userAchievements = await this.getUserAchievementsWithProgress(userId);

    const completedAchievements = userAchievements.filter(ua => ua.isCompleted);
    const totalPointsFromAchievements = completedAchievements.reduce((sum, ua) => {
      return sum + (ua.metadata?.points || 0);
    }, 0);

    const achievementsByCategory = userAchievements.reduce((acc, ua) => {
      const category = ua.metadata?.category as AchievementCategory;
      if (category) {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {} as Record<AchievementCategory, number>);

    const achievementsByRarity = completedAchievements.reduce((acc, ua) => {
      const rarity = ua.metadata?.rarity as AchievementRarity;
      if (rarity) {
        acc[rarity] = (acc[rarity] || 0) + 1;
      }
      return acc;
    }, {} as Record<AchievementRarity, number>);

    return {
      totalAchievements: userAchievements.length,
      completedAchievements: completedAchievements.length,
      totalPointsFromAchievements,
      achievementsByCategory,
      achievementsByRarity
    };
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
   * Get achievement by ID
   */
  getAchievementById(achievementId: string): Achievement | null {
    return TOKENIZATION_ACHIEVEMENTS.find(a => a.id === achievementId) || null;
  }

  /**
   * Get achievements by user progress
   */
  getAchievementsByProgress(userAchievements: UserAchievement[]): {
    completed: Achievement[];
    inProgress: Achievement[];
    notStarted: Achievement[];
  } {
    const completed: Achievement[] = [];
    const inProgress: Achievement[] = [];
    const notStarted: Achievement[] = [];

    for (const userAchievement of userAchievements) {
      const achievement = this.getAchievementById(userAchievement.achievementId);
      if (!achievement) continue;

      if (userAchievement.isCompleted) {
        completed.push(achievement);
      } else if (userAchievement.progress > 0) {
        inProgress.push(achievement);
      } else {
        notStarted.push(achievement);
      }
    }

    return { completed, inProgress, notStarted };
  }
}