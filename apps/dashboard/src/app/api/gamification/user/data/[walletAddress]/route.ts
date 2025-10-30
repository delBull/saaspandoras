import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, desc } from 'drizzle-orm';
import type {
  UserGamificationProfile,
  UserAchievement,
  Reward,
  LeaderboardEntry,
} from '@pandoras/gamification';
import {
  gamificationProfiles,
  userAchievements,
  achievements,
  rewards,
  users,
  type GamificationProfile as DrizzleGamificationProfile,
  type UserAchievement as DrizzleUserAchievement,
  type Achievement as DrizzleAchievement,
  type Reward as DrizzleReward,
} from '@/db/schema';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ walletAddress: string }> },
) {
  try {
    const params = await context.params;
    const walletAddressRaw = params.walletAddress;

    console.log(`🔍 API: Request received for wallet ${walletAddressRaw}`);
    console.log(`🔍 API: Params object:`, context.params);

    if (!walletAddressRaw) {
      console.error(`❌ API: No wallet address provided in params`);
      return NextResponse.json(
        { error: 'Wallet address is required', success: false },
        { status: 400 }
      );
    }

    // Normalize wallet address to lowercase for consistency with database
    const walletAddress = walletAddressRaw.toLowerCase();
    console.log(`🔍 API: Normalized wallet to lowercase: ${walletAddress}`);

    console.log(`🔍 API: Getting gamification data for wallet ${walletAddress}`);

    // 1. Get user ID from wallet address
    console.log(`🔍 API: Querying users table for wallet ${walletAddress} (case-normalized)`);
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);

    console.log(`🔍 API: User query result:`, userResult);

    if (!userResult || userResult.length === 0 || !userResult[0]) {
      console.log(`❌ User not found for wallet ${walletAddress}`);
      return NextResponse.json({
        profile: null,
        achievements: [],
        rewards: [],
        leaderboard: [],
        totalPoints: 0,
        currentLevel: 1,
        levelProgress: 0,
        success: true,
        message: 'User not found - no gamification data available'
      });
    }

    const userId = userResult[0].id;
    console.log(`🔍 API: Found user with ID ${userId} for wallet ${walletAddress}`);

    // 2. Get gamification profile
    const profileResult = await db
      .select()
      .from(gamificationProfiles)
      .where(eq(gamificationProfiles.userId, userId))
      .limit(1);

    let profile: UserGamificationProfile | null = null;

    if (profileResult && profileResult.length > 0 && profileResult[0]) {
      const dbProfile = profileResult[0];
      profile = {
        id: dbProfile.id.toString(),
        userId: dbProfile.userId.toString(),
        walletAddress: dbProfile.walletAddress,
        totalPoints: dbProfile.totalPoints,
        currentLevel: dbProfile.currentLevel,
        pointsToNextLevel: dbProfile.pointsToNextLevel,
        levelProgress: dbProfile.levelProgress,
        projectsApplied: dbProfile.projectsApplied,
        projectsApproved: dbProfile.projectsApproved,
        totalInvested: Number(dbProfile.totalInvested),
        communityContributions: dbProfile.communityContributions,
        currentStreak: dbProfile.currentStreak,
        longestStreak: dbProfile.longestStreak,
        lastActivityDate: new Date(dbProfile.lastActivityDate),
        totalActiveDays: dbProfile.totalActiveDays,
        referralsCount: dbProfile.referralsCount,
        communityRank: dbProfile.communityRank,
        reputationScore: dbProfile.reputationScore,
        createdAt: new Date(dbProfile.createdAt),
        updatedAt: new Date(dbProfile.updatedAt)
      };
    }

    // 3. Get user achievements
    const achievementsResult = await db
      .select({
        userAchievementId: userAchievements.id,
        achievementId: userAchievements.achievementId,
        progress: userAchievements.progress,
        isUnlocked: userAchievements.isUnlocked,
        unlockedAt: userAchievements.unlockedAt,
        name: achievements.name,
        description: achievements.description,
        icon: achievements.icon,
        type: achievements.type,
        pointsReward: achievements.pointsReward
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));

    const achievementsData: UserAchievement[] = achievementsResult.map((item) => ({
      id: item.achievementId.toString(),
      userId: walletAddress,
      achievementId: item.achievementId.toString(),
      progress: item.progress || 0,
      isCompleted: item.isUnlocked || false,
      isUnlocked: item.isUnlocked || false,
      completedAt: item.unlockedAt || undefined,
      name: item.name,
      description: item.description,
      icon: item.icon,
      category: item.type,
      points: item.pointsReward || 0,
      unlockedAt: item.unlockedAt || undefined,
      metadata: undefined
    }));

    // 4. Get available rewards (for now, return empty array)
    const rewardsData: Reward[] = [];

    // 5. Get leaderboard (simplified - top 10 by totalPoints)
    const leaderboardResult = await db
      .select({
        id: gamificationProfiles.id,
        userId: gamificationProfiles.userId,
        totalPoints: gamificationProfiles.totalPoints,
        walletAddress: gamificationProfiles.walletAddress,
        currentLevel: gamificationProfiles.currentLevel,
        projectsApplied: gamificationProfiles.projectsApplied,
        projectsApproved: gamificationProfiles.projectsApproved,
        totalInvested: gamificationProfiles.totalInvested,
        communityRank: gamificationProfiles.communityRank,
        lastActivityDate: gamificationProfiles.lastActivityDate,
        createdAt: gamificationProfiles.createdAt
      })
      .from(gamificationProfiles)
      .orderBy(desc(gamificationProfiles.totalPoints))
      .limit(10);

    const leaderboardData: LeaderboardEntry[] = leaderboardResult.map((item, index) => ({
      id: item.id.toString(),
      userId: item.userId,
      points: item.totalPoints,
      totalPoints: item.totalPoints,
      currentLevel: item.currentLevel,
      walletAddress: item.walletAddress,
      rank: index + 1,
      projectsApplied: item.projectsApplied,
      projectsApproved: item.projectsApproved,
      totalInvested: Number(item.totalInvested),
      achievementsUnlocked: 0, // TODO: calculate from user achievements
      communityRank: item.communityRank,
      lastActivity: new Date(item.lastActivityDate),
      levelProgress: 0, // TODO: calculate based on points
      currentStreak: 0, // TODO: add streak calculation
      reputationScore: 0, // TODO: add reputation calculation
      communityContributions: 0, // TODO: add community contrib calculation
      referralsCount: 0, // TODO: add referrals count
      joinedAt: new Date(item.createdAt)
    }));

    // Calculate derived values
    const totalPoints = profile?.totalPoints || 0;
    const currentLevel = profile?.currentLevel || 1;
    const levelProgress = profile?.levelProgress || 0;

    console.log(`✅ API: Retrieved gamification data for ${walletAddress}:`);
    console.log(`   - Profile: ${profile ? 'Yes' : 'No'} (Level ${currentLevel}, ${totalPoints} pts)`);
    console.log(`   - Achievements: ${achievementsData.length}`);
    console.log(`   - Leaderboard: ${leaderboardData.length} entries`);

    return NextResponse.json({
      profile,
      achievements: achievementsData,
      rewards: rewardsData,
      leaderboard: leaderboardData,
      totalPoints,
      currentLevel,
      levelProgress,
      success: true,
      message: `Gamification data loaded: ${achievementsData.length} achievements, ${leaderboardData.length} leaderboard entries`
    });

  } catch (error) {
    console.error('❌ API Error fetching gamification data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch gamification data',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
