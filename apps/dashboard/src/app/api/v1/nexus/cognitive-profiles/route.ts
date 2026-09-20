import { NextRequest, NextResponse } from 'next/server';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { db } from '@/db';
import { hermesCognitiveProfiles, marketingLeads } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await getNexusAuthContext();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId'); // Could be email or leadId or phone
    const wallet = searchParams.get('wallet');

    if (!userId && !wallet) {
      return NextResponse.json({ error: 'userId or wallet is required' }, { status: 400 });
    }

    const targetId = userId || wallet!;

    // 1. First, check if there's a lead that matches the targetId (by email, phone, or wallet)
    let leadIdToCheck: string | null = null;
    
    // We only search leads if the targetId is an email or phone or wallet, not a generic string.
    // If it's already a lead ID, it will just match directly in the next step.
    const leadMatch = await db.query.marketingLeads.findFirst({
      where: or(
        eq(marketingLeads.email, targetId),
        eq(marketingLeads.phoneNumber, targetId),
        eq(marketingLeads.walletAddress, targetId)
      )
    });

    if (leadMatch) {
      leadIdToCheck = leadMatch.id;
    }

    // 2. Query hermesCognitiveProfiles by targetId OR the found leadId
    const whereConditions = [eq(hermesCognitiveProfiles.userId, targetId)];
    if (leadIdToCheck) {
      whereConditions.push(eq(hermesCognitiveProfiles.userId, leadIdToCheck));
    }

    const records = await db
      .select()
      .from(hermesCognitiveProfiles)
      .where(or(...whereConditions))
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
