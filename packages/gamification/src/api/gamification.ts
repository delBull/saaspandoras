import { NextResponse } from "next/server";
import {
  gamificationEngine,
  pointsManager,
  achievementManager,
  rewardManager,
  EventType,
  PointsCategory
} from '../index';

// API Routes for gamification system
export const gamificationAPI = {
  // Track events
  async trackEvent(userId: string, eventType: EventType, metadata?: Record<string, any>) {
    try {
      const event = await gamificationEngine.trackEvent(userId, eventType, metadata);
      return NextResponse.json({ success: true, event });
    } catch (error) {
      console.error('Error tracking event:', error);
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      );
    }
  },

  // Award points
  async awardPoints(
    userId: string,
    points: number,
    reason: string,
    category: PointsCategory,
    metadata?: Record<string, any>
  ) {
    try {
      const pointsRecord = await pointsManager.awardPoints(
        userId,
        points,
        reason,
        category,
        metadata
      );
      return NextResponse.json({ success: true, points: pointsRecord });
    } catch (error) {
      console.error('Error awarding points:', error);
      return NextResponse.json(
        { error: 'Failed to award points' },
        { status: 500 }
      );
    }
  },

  // Get user profile
  async getUserProfile(userId: string) {
    try {
      const profile = await gamificationEngine.getUserProfile(userId);
      return NextResponse.json({ profile });
    } catch (error) {
      console.error('Error getting user profile:', error);
      return NextResponse.json(
        { error: 'Failed to get user profile' },
        { status: 500 }
      );
    }
  },

  // Get user achievements
  async getUserAchievements(userId: string) {
    try {
      const achievements = await achievementManager.getUserAchievementsWithProgress(userId);
      return NextResponse.json({ achievements });
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return NextResponse.json(
        { error: 'Failed to get user achievements' },
        { status: 500 }
      );
    }
  },

  // Get available rewards
  async getAvailableRewards(userId: string) {
    try {
      const rewards = await rewardManager.getAvailableRewardsForUser(userId);
      return NextResponse.json({ rewards });
    } catch (error) {
      console.error('Error getting available rewards:', error);
      return NextResponse.json(
        { error: 'Failed to get available rewards' },
        { status: 500 }
      );
    }
  },

  // Claim reward
  async claimReward(userId: string, rewardId: string) {
    try {
      const userReward = await rewardManager.claimReward(userId, rewardId);
      return NextResponse.json({ success: true, reward: userReward });
    } catch (error) {
      console.error('Error claiming reward:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to claim reward' },
        { status: 400 }
      );
    }
  },

  // Get leaderboard
  async getLeaderboard(type: string, limit: number = 10) {
    try {
      const leaderboard = await gamificationEngine.getLeaderboard(type, limit);
      return NextResponse.json({ leaderboard });
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to get leaderboard' },
        { status: 500 }
      );
    }
  }
};