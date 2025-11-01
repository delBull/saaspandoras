import { NextResponse } from "next/server";
import { db } from "@/db";
import { userPoints, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    const walletAddress = wallet.toLowerCase();

    // Find user by wallet
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);

    if (!user || user.length === 0 || !user[0]) {
      return NextResponse.json({ activities: [] });
    }

    const userId = user[0].id;

    // Get user's point activities sorted by date (most recent first)
    const activities = await db
      .select({
        id: userPoints.id,
        points: userPoints.points,
        reason: userPoints.reason,
        category: userPoints.category,
        createdAt: userPoints.createdAt,
        metadata: userPoints.metadata
      })
      .from(userPoints)
      .where(eq(userPoints.userId, userId))
      .orderBy(desc(userPoints.createdAt))
      .limit(50); // Last 50 activities

    // Format activities for frontend
    const formattedActivities = activities.map(activity => {
      // Ensure createdAt is always a valid Date
      const createdAtValue = activity.createdAt ?? new Date();
      const createdAt = createdAtValue instanceof Date ? createdAtValue : new Date(createdAtValue);
      const isoString = createdAt.toISOString();
      const datePart = isoString.split('T')[0] || '';
      const timePart = isoString.split('T')[1]?.split('.')[0] || '';
      return {
        id: activity.id != null ? activity.id.toString() : '',
        type: activity.category?.toString() === 'referral_made' ? 'referral' :
              activity.category?.toString() === 'daily_login' ? 'login' : 'other',
        points: activity.points || 0,
        reason: (activity.reason || ''),
        category: activity.category,
        createdAt: createdAt,
        date: datePart,
        time: timePart
      };
    });

    console.log(`✅ Retrieved ${formattedActivities.length} activities for user ${walletAddress.slice(0, 6)}...`);

    return NextResponse.json({
      activities: formattedActivities,
      total: formattedActivities.length
    });

  } catch (error) {
    console.error("Error fetching user activity:", error);
    return NextResponse.json({ activities: [] }, { status: 500 });
  }
}
