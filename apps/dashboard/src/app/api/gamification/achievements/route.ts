import { NextResponse } from 'next/server';
import { db } from '@/db';
import { achievements } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('🎯 API: Getting all available achievements');

    // Get all achievements with their metadata
    const allAchievements = await db
      .select()
      .from(achievements)
      .orderBy(achievements.id);

    console.log(`✅ API: Returned ${allAchievements.length} available achievements`);

    return NextResponse.json({
      achievements: allAchievements,
      success: true,
      message: `Available achievements loaded: ${allAchievements.length} achievements`
    });

  } catch (error) {
    console.error('❌ API Error fetching achievements:', error);
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
