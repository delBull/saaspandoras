import {
  Reward,
  UserReward,
  UserGamificationProfile,
  TOKENIZATION_REWARDS,
  RewardType,
  RewardRarity,
  RewardStatus
} from '../types';

export class RewardManager {
  private static instance: RewardManager;

  public static getInstance(): RewardManager {
    if (!RewardManager.instance) {
      RewardManager.instance = new RewardManager();
    }
    return RewardManager.instance;
  }

  /**
   * Get all available rewards
   */
  getAllRewards(): Reward[] {
    return TOKENIZATION_REWARDS;
  }

  /**
   * Get rewards by type
   */
  getRewardsByType(type: RewardType): Reward[] {
    return TOKENIZATION_REWARDS.filter(reward => reward.type === type);
  }

  /**
   * Get rewards by rarity
   */
  getRewardsByRarity(rarity: RewardRarity): Reward[] {
    return TOKENIZATION_REWARDS.filter(reward => reward.rarity === rarity);
  }

  /**
   * Get available rewards for user
   */
  async getAvailableRewardsForUser(userId: string): Promise<Reward[]> {
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) return [];

    return TOKENIZATION_REWARDS.filter(reward => {
      // Check level requirement
      if (userProfile.currentLevel < reward.requiredLevel) return false;

      // Check points requirement
      if (userProfile.totalPoints < reward.requiredPoints) return false;

      // Check if reward is still available
      if (!reward.isActive) return false;

      // Check if limited reward and max claims reached
      if (reward.isLimited && reward.totalClaims >= (reward.maxClaims || 0)) return false;

      return true;
    });
  }

  /**
   * Check if user can claim reward
   */
  async canUserClaimReward(userId: string, rewardId: string): Promise<{
    canClaim: boolean;
    reason?: string;
    userReward?: UserReward;
  }> {
    const reward = TOKENIZATION_REWARDS.find(r => r.id === rewardId);
    if (!reward) {
      return { canClaim: false, reason: 'Reward not found' };
    }

    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) {
      return { canClaim: false, reason: 'User profile not found' };
    }

    // Check level requirement
    if (userProfile.currentLevel < reward.requiredLevel) {
      return { canClaim: false, reason: `Requires level ${reward.requiredLevel}` };
    }

    // Check points requirement
    if (userProfile.totalPoints < reward.requiredPoints) {
      return { canClaim: false, reason: `Requires ${reward.requiredPoints} points` };
    }

    // Check if reward is active
    if (!reward.isActive) {
      return { canClaim: false, reason: 'Reward is not active' };
    }

    // Check if limited reward and max claims reached
    if (reward.isLimited && reward.totalClaims >= (reward.maxClaims || 0)) {
      return { canClaim: false, reason: 'Reward limit reached' };
    }

    // Check if user already claimed this reward
    const existingClaim = await this.getUserReward(userId, rewardId);
    if (existingClaim && existingClaim.status === RewardStatus.CLAIMED) {
      return { canClaim: false, reason: 'Already claimed', userReward: existingClaim };
    }

    return { canClaim: true };
  }

  /**
   * Claim reward for user
   */
  async claimReward(userId: string, rewardId: string): Promise<UserReward> {
    const canClaim = await this.canUserClaimReward(userId, rewardId);

    if (!canClaim.canClaim) {
      throw new Error(canClaim.reason || 'Cannot claim reward');
    }

    const reward = TOKENIZATION_REWARDS.find(r => r.id === rewardId);
    if (!reward) {
      throw new Error('Reward not found');
    }

    const userReward: UserReward = {
      id: `ur_${userId}_${rewardId}_${Date.now()}`,
      userId,
      rewardId,
      status: RewardStatus.CLAIMED,
      claimedAt: new Date(),
      metadata: {
        type: reward.type,
        value: reward.value,
        rarity: reward.rarity
      }
    };

    console.log(`🎁 Reward claimed: ${reward.name} for user ${userId}`);

    return userReward;
  }

  /**
   * Get user rewards
   */
  async getUserRewards(userId: string): Promise<UserReward[]> {
    // This would fetch from database
    console.log(`🎁 Fetching rewards for user ${userId}`);
    return [];
  }

  /**
   * Get specific user reward
   */
  async getUserReward(userId: string, rewardId: string): Promise<UserReward | null> {
    // This would fetch from database
    console.log(`🎁 Fetching reward ${rewardId} for user ${userId}`);
    return null;
  }

  /**
   * Get reward statistics
   */
  async getRewardStats(userId: string): Promise<{
    totalRewards: number;
    claimedRewards: number;
    availableRewards: number;
    totalValue: number;
    rewardsByType: Record<RewardType, number>;
    rewardsByRarity: Record<RewardRarity, number>;
  }> {
    const userRewards = await this.getUserRewards(userId);
    const availableRewards = await this.getAvailableRewardsForUser(userId);

    const claimedRewards = userRewards.filter(ur => ur.status === RewardStatus.CLAIMED);
    const totalValue = claimedRewards.reduce((sum, ur) => {
      return sum + (ur.metadata?.value || 0);
    }, 0);

    const rewardsByType = claimedRewards.reduce((acc, ur) => {
      const type = ur.metadata?.type as RewardType;
      if (type) {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {} as Record<RewardType, number>);

    const rewardsByRarity = claimedRewards.reduce((acc, ur) => {
      const rarity = ur.metadata?.rarity as RewardRarity;
      if (rarity) {
        acc[rarity] = (acc[rarity] || 0) + 1;
      }
      return acc;
    }, {} as Record<RewardRarity, number>);

    return {
      totalRewards: userRewards.length,
      claimedRewards: claimedRewards.length,
      availableRewards: availableRewards.length,
      totalValue,
      rewardsByType,
      rewardsByRarity
    };
  }

  /**
   * Get reward by ID
   */
  getRewardById(rewardId: string): Reward | null {
    return TOKENIZATION_REWARDS.find(r => r.id === rewardId) || null;
  }

  /**
   * Get rewards by user level
   */
  getRewardsByUserLevel(userLevel: number): Reward[] {
    return TOKENIZATION_REWARDS.filter(reward => {
      return userLevel >= reward.requiredLevel && reward.isActive;
    });
  }

  /**
   * Get rewards expiring soon
   */
  getExpiringRewards(days: number = 7): Reward[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return TOKENIZATION_REWARDS.filter(reward => {
      return reward.expiresAt && reward.expiresAt <= futureDate && reward.isActive;
    });
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
   * Calculate total value of user rewards
   */
  async calculateUserRewardValue(userId: string): Promise<number> {
    const userRewards = await this.getUserRewards(userId);
    const claimedRewards = userRewards.filter(ur => ur.status === RewardStatus.CLAIMED);

    return claimedRewards.reduce((total, reward) => {
      return total + (reward.metadata?.value || 0);
    }, 0);
  }

  /**
   * Get reward recommendations for user
   */
  async getRewardRecommendations(userId: string, limit: number = 5): Promise<Reward[]> {
    const availableRewards = await this.getAvailableRewardsForUser(userId);

    // Sort by value and relevance
    return availableRewards
      .sort((a, b) => {
        // Prioritize higher value rewards
        if (a.value !== b.value) return b.value - a.value;
        // Then by rarity
        const rarityOrder = { legendary: 4, epic: 3, rare: 2, uncommon: 1, common: 0 };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      })
      .slice(0, limit);
  }
}