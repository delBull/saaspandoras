import { NextResponse } from 'next/server';
import { getCanonicalAuth } from '@/lib/auth';
import { EscalationService } from '@/lib/hermes/escalation/escalation-service';
import { db } from '@/db';
import { daoMembers, projects, hermesEscalations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const { tenantSlug, escalationId, message } = await req.json();

    if (!tenantSlug || !escalationId || !message) {
      return NextResponse.json({ error: 'tenantSlug, escalationId and message are required' }, { status: 400 });
    }

    // 1. Authorization
    const { user, isVerified } = await getCanonicalAuth();
    if (!user || !isVerified) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, tenantSlug)
    });
    if (!project) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const membership = await db.query.daoMembers.findFirst({
      where: (member, { eq, ilike, and }) => and(
        eq(member.projectId, project.id),
        ilike(member.wallet, user.walletAddress)
      )
    });

    if (!membership && user.walletAddress !== process.env.ADMIN_WALLET) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch escalation to get the conversationId
    const activeEscalation = await db.query.hermesEscalations.findFirst({
        where: (esc, { eq, and }) => and(
            eq(esc.organizationId, tenantSlug),
            eq(esc.id, escalationId)
        )
    });

    if (!activeEscalation || activeEscalation.status === 'RESOLVED') {
       return NextResponse.json({ error: 'Escalation is not active' }, { status: 400 });
    }

    const operatorId = user.walletAddress;

    // 3. Persist the reply in the DB via Service
    await EscalationService.replyAsHuman({
        organizationId: tenantSlug,
        escalationId: escalationId,
        content: message,
        operatorId: operatorId
    });
    
    // 4. Dispatch message to Edge Outbound Queue securely
    const edgeOutboundUrl = process.env.EDGE_OUTBOUND_WEBHOOK_URL || 'http://localhost:3000/api/telegram/outbound';
    const edgeSecret = process.env.HERMES_EDGE_SECRET || '';

    if (!edgeSecret && process.env.NODE_ENV === 'production') {
        console.warn('[HITL Reply] HERMES_EDGE_SECRET missing in production. Proceeding fail-open for legacy edge support.');
    }
    
    try {
        await axios.post(edgeOutboundUrl, {
            chatId: activeEscalation.conversationId,
            text: message,
            tenantId: tenantSlug
        }, {
            headers: {
                'x-edge-secret': edgeSecret,
                'Content-Type': 'application/json'
            }
        });
    } catch (edgeErr: any) {
        console.error('[HITL Reply] Failed to dispatch to edge:', edgeErr.message);
        // We log the error but still return success because the message was persisted.
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
