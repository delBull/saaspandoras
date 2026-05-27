import { NextResponse } from 'next/server';
import { db } from '@/db';
import { daoActivitySubmissions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const EDGE_KEY = process.env.PANDORA_CORE_KEY ?? '';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/internal/dao/activities/submissions
 *
 * Internal endpoint for Edge API (TMA) to list user's submissions.
 * Authenticated via x-pandora-key header (S2S).
 */
export async function GET(req: Request) {
  try {
    const incomingKey = req.headers.get('x-pandora-key') ?? req.headers.get('authorization')?.replace('Bearer ', '');
    if (!incomingKey || !EDGE_KEY || incomingKey !== EDGE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');
    const projectId = searchParams.get('projectId');

    if (!wallet) {
      return NextResponse.json({ error: 'Missing required query param: wallet' }, { status: 400 });
    }

    const conditions = [
      eq(daoActivitySubmissions.userWallet, wallet.toLowerCase()),
    ];

    if (projectId) {
      conditions.push(eq(daoActivitySubmissions.projectId, Number(projectId)));
    }

    const submissions = await db.query.daoActivitySubmissions.findMany({
      where: and(...conditions),
      orderBy: desc(daoActivitySubmissions.createdAt),
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('[Internal] Error fetching submissions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
