import { NextResponse } from 'next/server';
import { db } from '@/db';
import { daoActivitySubmissions, daoActivities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const EDGE_KEY = process.env.PANDORA_CORE_KEY ?? '';

/**
 * POST /api/v1/internal/dao/activities/submit
 *
 * Internal endpoint for Edge API (TMA) to submit activity proof.
 * Authenticated via x-pandora-key header (S2S).
 */
export async function POST(req: Request) {
  try {
    // S2S Authentication
    const incomingKey = req.headers.get('x-pandora-key') ?? req.headers.get('authorization')?.replace('Bearer ', '');
    if (!incomingKey || !EDGE_KEY || incomingKey !== EDGE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { activityId, userWallet, proofData } = body;

    if (!activityId || !userWallet) {
      return NextResponse.json({ error: 'Missing Required Fields: activityId, userWallet' }, { status: 400 });
    }

    if (userWallet.length !== 42 || !userWallet.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid userWallet format' }, { status: 400 });
    }

    // Verify activity exists and is active
    const activity = await db.query.daoActivities.findFirst({
      where: eq(daoActivities.id, activityId),
    });

    if (!activity || activity.status !== 'active') {
      return NextResponse.json({ error: 'Activity not active or not found' }, { status: 400 });
    }

    // Check for existing pending submission (prevent duplicates)
    const wallet = userWallet.toLowerCase();
    const existing = await db.query.daoActivitySubmissions.findFirst({
      where: and(
        eq(daoActivitySubmissions.activityId, activityId),
        eq(daoActivitySubmissions.userWallet, wallet),
      ),
    });

    if (existing && existing.status === 'pending') {
      return NextResponse.json({ error: 'You already have a pending submission for this activity' }, { status: 409 });
    }

    // Create submission
    const submission = await db.insert(daoActivitySubmissions).values({
      projectId: activity.projectId,
      activityId,
      userWallet: userWallet.toLowerCase(),
      proofData: proofData || null,
      status: 'pending',
    }).returning();

    return NextResponse.json(submission[0]);
  } catch (error) {
    console.error('[Internal] Error submitting activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
