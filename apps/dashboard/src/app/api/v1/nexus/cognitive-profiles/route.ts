import { NextRequest, NextResponse } from 'next/server';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { db } from '@/db';
import { hermesCognitiveProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await getNexusAuthContext();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const wallet = searchParams.get('wallet');

    if (!userId && !wallet) {
      return NextResponse.json({ error: 'userId or wallet is required' }, { status: 400 });
    }

    const targetId = userId || wallet!;

    const records = await db
      .select()
      .from(hermesCognitiveProfiles)
      .where(eq(hermesCognitiveProfiles.userId, targetId))
      .limit(1);

    if (records.length === 0) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: records[0] });
  } catch (error) {
    console.error('[API] Error fetching cognitive profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
