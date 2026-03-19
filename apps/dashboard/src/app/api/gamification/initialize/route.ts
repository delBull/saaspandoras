import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    console.log('🚀 Initializing gamification system...');

    // Check if this is a request to award initial points
    const body = await request.text();
    const params = new URLSearchParams(body);

    if (params.get('awardInitialPoints') === 'true' && params.get('userId')) {
      const userId = params.get('userId')!;

      try {
        console.log('🎯 Awarding initial points to user:', userId);

        // Add 10 points to existing total
        await db.execute(sql`
          UPDATE gamification_profiles
          SET total_points = total_points + 10, updated_at = NOW()
          WHERE user_id = ${userId}
        `);

        console.log('✅ Points added successfully');
        return NextResponse.json({
          success: true,
          message: `Initial points awarded successfully to ${userId}`,
          data: { pointsAwarded: 10 }
        });

      } catch (initialPointsError) {
        console.error('Error awarding initial points:', initialPointsError);
        const errorMessage = initialPointsError instanceof Error ? initialPointsError.message : 'Unknown error';
        return NextResponse.json(
          {
            error: 'Failed to award initial points',
            details: errorMessage
          },
          { status: 500 }
        );
      }
    }

    // Initialize achievements
    let achievementsCreated = 0;
    if (params.get('seedAchievements') === 'true') {
      console.log('🏆 Initializing achievements via dedicated route...');
      const { achievements: achievementsTable } = await import('@/db/schema');
      const countBefore = await db.select({ count: sql`count(*)` }).from(achievementsTable);
      
      const { GamificationService } = await import('@/lib/gamification/service');
      await GamificationService.initializeBasicAchievements();
      
      const countAfter = await db.select({ count: sql`count(*)` }).from(achievementsTable);
      
      const after = Number(countAfter[0]?.count || 0);
      const before = Number(countBefore[0]?.count || 0);
      achievementsCreated = after - before;
    }

    return NextResponse.json({
      success: true,
      message: 'Gamification system initialized successfully',
      data: {
        achievementsCreated,
        message: 'Ready for gamification events'
      }
    });

  } catch (error) {
    console.error('❌ Error initializing gamification system:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to initialize gamification system',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
