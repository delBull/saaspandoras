import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, desc, and, sql } from 'drizzle-orm';
import type {
  UserGamificationProfile,
  UserAchievement,
  Reward,
  LeaderboardEntry,
} from '@pandoras/gamification';
import {
  gamificationProfiles,
  userAchievements,
  userPoints,
  achievements,
  rewards,
  users,
  type GamificationProfile as DrizzleGamificationProfile,
  type UserAchievement as DrizzleUserAchievement,
  type Reward as DrizzleReward,
} from '@/db/schema';
import { ilike } from 'drizzle-orm';
import { GamificationService } from '@/lib/gamification/service';

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

    // 🚀 Hardened with Retry to handle ECONNRESET
    const { withRetry } = await import("@/lib/database");

    return await withRetry(async () => {
      // 🔍 1. Resolve User & Fetch Global Data in Parallel
      console.log(`🔍 API: Querying users table for identifier ${walletAddress}`);
      
      const [userResult, allAchievements, leaderboardResult] = await Promise.all([
        db
          .select({ id: users.id })
          .from(users)
          .where(
            walletAddress.startsWith('0x')
              ? ilike(users.walletAddress, walletAddress)
              : eq(users.id, walletAddress)
          )
          .limit(1),
        db.select().from(achievements).orderBy(achievements.id),
        db
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
            createdAt: gamificationProfiles.createdAt,
            name: users.name,
            image: users.image,
          })
          .from(gamificationProfiles)
          .leftJoin(users, eq(gamificationProfiles.userId, users.id))
          .orderBy(desc(gamificationProfiles.totalPoints))
          .limit(10)
      ]);

      console.log(`🔍 API: User resolution result:`, userResult);

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

      const userId = userResult[0]?.id;
      if (!userId) {
        return NextResponse.json({ profile: null, achievements: [], rewards: [], leaderboard: [], totalPoints: 0, currentLevel: 1, levelProgress: 0, success: true, message: 'User ID not found' });
      }

      // 2. Fetch User-Specific Data in Parallel
      const [profileResult, userProgress] = await Promise.all([
        db.select().from(gamificationProfiles).where(eq(gamificationProfiles.userId, userId)).limit(1),
        db.select().from(userAchievements).where(eq(userAchievements.userId, userId))
      ]);

      // ===== AUTO-INITIALIZATION FOR EXISTING USERS WITHOUT PROFILE =====
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
      } else {
        console.log(`🎯 User found without gamification profile. Initializing basics (no seeding)...`);
        try {
          const initialProfile = {
            userId: userId.toString(),
            walletAddress: walletAddress,
            totalPoints: 10,
            currentLevel: 1,
            levelProgress: 10,
            pointsToNextLevel: 90,
            projectsApplied: 0,
            projectsApproved: 0,
            totalInvested: "0.00",
            communityContributions: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalActiveDays: 1,
            referralsCount: 0,
            communityRank: 0,
            reputationScore: 0,
            lastActivityDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const [newProfile] = await db.insert(gamificationProfiles).values(initialProfile).returning();
          if (newProfile) {
            profile = {
              id: newProfile.id.toString(),
              userId: userId.toString(),
              walletAddress: walletAddress,
              totalPoints: 10,
              currentLevel: 1,
              pointsToNextLevel: 90,
              levelProgress: 10,
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
            };
            
            await db.insert(userPoints).values({
              userId: userId,
              points: 10,
              reason: 'Primer Login: Conexión inicial al sistema',
              category: 'daily_login',
              metadata: JSON.stringify({ type: 'first_login' }),
              createdAt: new Date()
            });
          }
        } catch (initError) {
          console.error(`❌ Error in auto-init for ${walletAddress}:`, initError);
        }
      }

      console.log(`🔍 API DIAGNOSTIC: Found ${allAchievements.length} total achievements and ${userProgress.length} user progress records.`);

      // 5. Map achievements to user progress
      const progressMap = new Map(userProgress.map((p: any) => [p.achievementId, p]));

      const achievementsData: UserAchievement[] = allAchievements.map((item) => {
        const progressRecord = progressMap.get(item.id) as any;

        const rawType = item.type || 'community';
        let rarity = 'first_steps';
        if (['high_roller', 'tokenization_expert', 'dao_pioneer'].includes(rawType)) rarity = 'high_roller';
        else if (['early_adopter', 'governor', 'yield_hunter'].includes(rawType)) rarity = 'early_adopter';
        else if (['community_builder', 'creator'].includes(rawType)) rarity = 'community_builder';
        else if (['investor', 'defi_starter'].includes(rawType)) rarity = 'investor';

        let category = 'community';
        if (['investor', 'defi_starter', 'yield_hunter'].includes(rawType)) category = 'investor';
        else if (['creator', 'protocol_deployed', 'artifact_collector'].includes(rawType)) category = 'creator';
        else if (['tokenization_expert', 'early_adopter', 'governor', 'dao_pioneer'].includes(rawType)) category = 'expert';

        return {
          id: item.id.toString(),
          userId: walletAddress,
          achievementId: item.id.toString(),
          progress: progressRecord?.progress || 0,
          isCompleted: Boolean(progressRecord?.isUnlocked),
          isUnlocked: Boolean(progressRecord?.isUnlocked),
          completedAt: progressRecord?.unlockedAt || undefined,
          name: item.name,
          description: item.description,
          icon: item.icon,
          points: item.pointsReward || 0,
          unlockedAt: progressRecord?.unlockedAt || undefined,
          type: rawType,
          category: category,
          rarity: rarity,
          metadata: undefined
        };
      });

      const rewardsData: Reward[] = [];

      const leaderboardData: LeaderboardEntry[] = leaderboardResult.map((item, index) => ({
        id: item.id.toString(),
        userId: item.userId,
        points: item.totalPoints,
        totalPoints: item.totalPoints,
        currentLevel: item.currentLevel,
        walletAddress: item.walletAddress,
        username: item.name || `${item.walletAddress.slice(0, 6)}...${item.walletAddress.slice(-4)}`,
        avatarUrl: item.image || undefined,
        rank: index + 1,
        projectsApplied: item.projectsApplied,
        projectsApproved: item.projectsApproved,
        totalInvested: Number(item.totalInvested),
        achievementsUnlocked: 0, 
        communityRank: item.communityRank,
        lastActivity: new Date(item.lastActivityDate),
        levelProgress: 0, 
        currentStreak: 0, 
        reputationScore: 0, 
        communityContributions: 0, 
        referralsCount: 0, 
        joinedAt: new Date(item.createdAt)
      }));

      // 6. Calculate actual rank for this user (Global Position)
      let userRank = 'N/A';
      try {
        if (profile && profile.totalPoints > 0) {
          const rankResult = await db
            .select({ count: sql`count(*)` })
            .from(gamificationProfiles)
            .where(sql`${gamificationProfiles.totalPoints} > ${profile.totalPoints}`);
          
          userRank = (Number(rankResult[0]?.count || 0) + 1).toString();
          console.log(`📊 API rank for ${walletAddress}: #${userRank} (with ${profile.totalPoints} pts)`);
        }
      } catch (rankError) {
        console.warn(`⚠️ Failed to calculate rank for ${walletAddress}:`, rankError);
      }

      // Calculate derived values
      const totalPoints = profile?.totalPoints || 0;
      const currentLevel = profile?.currentLevel || 1;
      const levelProgress = profile?.levelProgress || 0;

      console.log(`✅ API: Retrieved gamification data for ${walletAddress}:`);
      console.log(`   - Profile: ${profile ? 'Yes' : 'No'} (Level ${currentLevel}, ${totalPoints} pts, Rank: ${userRank})`);
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
        userRank, // 🔥 ADDED: Actual global rank
        success: true,
        message: `Gamification data loaded: ${achievementsData.length} achievements, ${leaderboardData.length} leaderboard entries`
      });
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
