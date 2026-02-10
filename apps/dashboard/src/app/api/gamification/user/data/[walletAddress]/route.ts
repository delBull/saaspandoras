import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, desc, and } from 'drizzle-orm';
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

    const userId = userResult[0]?.id;
    if (!userId) {
      console.log(`❌ API: User ID is null for wallet ${walletAddress}`);
      return NextResponse.json({
        profile: null,
        achievements: [],
        rewards: [],
        leaderboard: [],
        totalPoints: 0,
        currentLevel: 1,
        levelProgress: 0,
        success: true,
        message: 'User ID not found'
      });
    }
    console.log(`🔍 API: Found user with ID ${userId} for wallet ${walletAddress}`);

    // 2. Get gamification profile
    const profileResult = await db
      .select()
      .from(gamificationProfiles)
      .where(eq(gamificationProfiles.userId, userId))
      .limit(1);

    // ===== INICIALIZACIÓN AUTOMÁTICA PARA USUARIOS EXISTENTES =====
    // Si el usuario existe en users pero NO tiene perfil de gamificación,
    // creamos perfil básico con "Primer Login" (+10 pts) automáticamente
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
      // 🔥 USUARIO EXISTENTE SIN PERfil GAMIFICACIÓN - INICIALIZACIÓN AUTOMÁTICA
      console.log(`🎯 Usuario encontrado sin perfil gamificación. Inicializando automáticamente...`);

      try {
        // 1. Crear perfil básico con 10 puntos (Primer Login)
        const initialProfile = {
          userId: userId.toString(),
          walletAddress: walletAddress,
          totalPoints: 10, // Primer Login bonus
          currentLevel: 1,
          levelProgress: 10,
          pointsToNextLevel: 90,
          projectsApplied: 0,
          projectsApproved: 0,
          totalInvested: "0.00",
          communityContributions: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalActiveDays: 1, // Hoy cuenta como día activo
          referralsCount: 0,
          communityRank: 0,
          reputationScore: 0,
          lastActivityDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const newProfileResult = await db.insert(gamificationProfiles).values(initialProfile).returning();
        if (newProfileResult[0]) {
          profile = {
            id: newProfileResult[0].id.toString(),
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
          console.log(`✅ Perfil gamificación creado con 10 puntos iniciales`);

          // 2. Registrar puntos iniciales con razón específica
          await db.insert(userPoints).values({
            userId: userId,
            points: 10,
            reason: 'Primer Login: Conexión inicial al sistema',
            category: 'daily_login',
            metadata: JSON.stringify({ type: 'first_login' }),
            createdAt: new Date()
          });

          // 3. Otorgar achievement "Primer Login" automáticamente
          // Buscar el achievement por nombre
          const firstLoginAchievement = await db
            .select({ id: achievements.id })
            .from(achievements)
            .where(eq(achievements.name, 'Primer Login'))
            .limit(1);

          if (firstLoginAchievement[0]) {
            await db.insert(userAchievements).values({
              userId: userId,
              achievementId: firstLoginAchievement[0].id,
              progress: 100,
              isUnlocked: true,
              unlockedAt: new Date(),
              updatedAt: new Date()
            });

            console.log(`🎉 Achievement "Primer Login" otorgado automáticamente`);
          }

          console.log(`🎯 Inicialización completada: usuario ${walletAddress} ahora tiene 10 pts iniciales y achievement "Primer Login"`);
        }
      } catch (initError) {
        console.error(`❌ Error en inicialización automática para ${walletAddress}:`, initError);
        // No lanzamos error - el usuario podrá seguir usando el sistema sin gamificación por ahora
      }
    }

    // 3. Get ALL available achievements with user progress (LEFT JOIN to include all achievements)
    const achievementsResult = await db
      .select({
        userAchievementId: userAchievements.id,
        achievementId: achievements.id,
        progress: userAchievements.progress,
        isUnlocked: userAchievements.isUnlocked,
        unlockedAt: userAchievements.unlockedAt,
        name: achievements.name,
        description: achievements.description,
        icon: achievements.icon,
        type: achievements.type,
        pointsReward: achievements.pointsReward
      })
      .from(achievements)
      .leftJoin(userAchievements, and(
        eq(achievements.id, userAchievements.achievementId),
        eq(userAchievements.userId, userId)
      ))
      .orderBy(achievements.id); // Consistent ordering

    const achievementsData: UserAchievement[] = achievementsResult.map((item) => ({
      id: item.achievementId.toString(),
      userId: walletAddress,
      achievementId: item.achievementId.toString(),
      progress: item.progress || 0,
      isCompleted: Boolean(item.isUnlocked), // Convert to boolean - null becomes false
      isUnlocked: Boolean(item.isUnlocked), // Convert to boolean - null becomes false
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

    // 5. Get leaderboard (JOIN with users to get name and image)
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
        createdAt: gamificationProfiles.createdAt,
        // Added user details
        name: users.name,
        image: users.image,
      })
      .from(gamificationProfiles)
      .leftJoin(users, eq(gamificationProfiles.userId, users.id))
      .orderBy(desc(gamificationProfiles.totalPoints))
      .limit(10);

    const leaderboardData: LeaderboardEntry[] = leaderboardResult.map((item, index) => ({
      id: item.id.toString(),
      userId: item.userId,
      points: item.totalPoints,
      totalPoints: item.totalPoints,
      currentLevel: item.currentLevel,
      walletAddress: item.walletAddress,
      // Map user details - fallback to wallet abbreviation if no name
      username: item.name || `${item.walletAddress.slice(0, 6)}...${item.walletAddress.slice(-4)}`,
      avatarUrl: item.image || undefined,
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
