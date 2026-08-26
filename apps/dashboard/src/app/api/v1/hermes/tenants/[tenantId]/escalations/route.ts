import { NextRequest, NextResponse } from 'next/server';
import { EscalationService, EscalationStatus, EscalationReason, ChannelType } from '@/lib/hermes/escalation/escalation-service';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const portalCtx = await resolvePortalContext(tenantId).catch(() => null);
    const orgId = portalCtx?.tenant.organizationSlug || tenantId;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as EscalationStatus | undefined;

    const escalations = await EscalationService.getEscalations(orgId, status);
    return NextResponse.json({ success: true, escalations });
  } catch (error: any) {
    console.error('Error fetching escalations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const portalCtx = await resolvePortalContext(tenantId).catch(() => null);
    const orgId = portalCtx?.tenant.organizationSlug || tenantId;

    const body = await req.json();
    const { conversationId, actorId, channel, reason, notes } = body;

    if (!conversationId || !reason) {
      return NextResponse.json(
        { success: false, error: 'conversationId and reason are required' },
        { status: 400 }
      );
    }

    const escalation = await EscalationService.triggerEscalation({
      organizationId: orgId,
      conversationId,
      actorId,
      channel: (channel as ChannelType) || 'TELEGRAM',
      reason: (reason as EscalationReason) || 'MANUAL',
      notes,
    });

    return NextResponse.json({ success: true, escalation }, { status: 201 });
  } catch (error: any) {
    console.error('Error triggering escalation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
