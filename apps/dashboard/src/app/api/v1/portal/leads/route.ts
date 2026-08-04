import { NextRequest, NextResponse } from 'next/server';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { db } from '@/db';
import { marketingLeads } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/portal/leads
 * Resolves leads associated with the active portal session token
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionToken = searchParams.get('sessionToken') || req.headers.get('x-portal-session');

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token missing' }, { status: 401 });
    }

    const session = await validatePortalSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid portal session' }, { status: 401 });
    }

    // Query leads for this project
    const leads = await db
      .select({
        id: marketingLeads.id,
        name: marketingLeads.name,
        email: marketingLeads.email,
        phone: marketingLeads.phoneNumber,
        status: marketingLeads.status,
        intent: marketingLeads.intent,
        score: marketingLeads.score,
        quality: marketingLeads.quality,
        origin: marketingLeads.origin,
        metadata: marketingLeads.metadata,
        createdAt: marketingLeads.createdAt,
      })
      .from(marketingLeads)
      .where(eq(marketingLeads.projectId, session.projectId))
      .orderBy(desc(marketingLeads.createdAt))
      .limit(100);

    return NextResponse.json({
      success: true,
      projectId: session.projectId,
      leads: leads || []
    });
  } catch (err: any) {
    console.error('[Portal Leads Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch portal leads', details: err.message }, { status: 500 });
  }
}
