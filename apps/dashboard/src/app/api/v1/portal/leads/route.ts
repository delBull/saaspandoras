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

/**
 * POST /api/v1/portal/leads
 * Public capture of prospective client leads from Revenue Closer and portal landing forms.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, source = 'revenue_closer_landing', metadata } = body;

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone required' }, { status: 400 });
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;
    const cleanPhone = phone ? String(phone).trim() : undefined;

    const [lead] = await db.insert(marketingLeads).values({
      projectId: 1, // Pandora Genesis Project
      name: name ? String(name).trim() : undefined,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      intent: 'revenue_closer' as any,
      origin: source,
      metadata: {
        source_api: '/api/v1/portal/leads',
        capturedAt: new Date().toISOString(),
        ...(metadata || {})
      }
    }).returning({ id: marketingLeads.id });

    return NextResponse.json({
      success: true,
      leadId: lead?.id,
      message: 'Lead captured successfully'
    });
  } catch (err: any) {
    console.error('[Capture Portal Lead Error]:', err);
    return NextResponse.json({ error: 'Failed to capture lead', details: err.message }, { status: 500 });
  }
}
