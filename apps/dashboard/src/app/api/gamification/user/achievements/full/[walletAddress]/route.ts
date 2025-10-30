import { NextResponse } from 'next/server';
import { db } from '@/db';
import { achievements, userAchievements, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  context: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const params = await context.params;
    const walletAddressRaw = params.walletAddress;

    if (!walletAddressRaw) {
      return NextResponse.json(
        { error: 'Wallet address is required', success: false },
        { status: 400 }
      );
    }

    // Normalize wallet address
    const walletAddress = walletAddressRaw.toLowerCase();
    console.log(`🎯 API: Getting all achievements with status for wallet ${walletAddress}`);

    // Get user ID
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);

    if (!user) {
      console.log(`❌ User not found for achievements: ${walletAddress}`);
      return NextResponse.json({
        achievements: [],
        success: true,
        message: 'User not found - no achievements available'
      });
    }

    const userId = user.id;
    console.log(`✅ Found user ID: ${userId}`);

    // Get all active achievements
    console.log(`🔍 Processing achievements for user: ${userId}`);

    const allAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.isActive, true))
      .orderBy(achievements.id);

    console.log(`🗃️ Found ${allAchievements.length} active achievements in DB`);

    // Get user's achievement progress
    const userAchievementsData = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    console.log(`🏅 User has ${userAchievementsData.length} achievement records`);

    // Combine achievements with user progress
    const formattedAchievements = allAchievements.map(achievement => {
      const userProgress = userAchievementsData.find(ua => ua.achievementId === achievement.id);

      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        type: achievement.type,
        pointsReward: achievement.pointsReward,
        isActive: achievement.isActive,
        isSecret: achievement.isSecret,
        // User achievement status
        isUnlocked: userProgress?.isUnlocked || false,
        progress: userProgress?.progress || 0,
        unlockedAt: userProgress?.unlockedAt
      };
    });

    console.log(`� Sample achievement: ${formattedAchievements[0]?.name} - unlocked: ${formattedAchievements[0]?.isUnlocked}`);

    console.log(`✅ API: Returned ${formattedAchievements.length} achievements with user status for ${walletAddress}`);
    console.log(`�📊 Breakdown - Total: ${formattedAchievements.length}, Completed: ${formattedAchievements.filter(a => a.isUnlocked).length}`);

    return NextResponse.json({
      achievements: formattedAchievements,
      totalAchievements: formattedAchievements.length,
      completedAchievements: formattedAchievements.filter(a => a.isUnlocked).length,
      pendingAchievements: formattedAchievements.filter(a => !a.isUnlocked).length,
      success: true,
      message: `All achievements loaded: ${formattedAchievements.length} total, ${formattedAchievements.filter(a => a.isUnlocked).length} completed`
    });

  } catch (error) {
    console.error('❌ API Error fetching achievements with status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch achievements',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
