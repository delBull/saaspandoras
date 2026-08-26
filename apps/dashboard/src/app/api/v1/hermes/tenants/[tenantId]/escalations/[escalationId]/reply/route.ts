import { NextRequest, NextResponse } from 'next/server';
import { EscalationService } from '@/lib/hermes/escalation/escalation-service';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; escalationId: string }> }
) {
  try {
    const { tenantId, escalationId } = await params;
    const portalCtx = await resolvePortalContext(tenantId).catch(() => null);
    const orgId = portalCtx?.tenant.organizationSlug || tenantId;

    const body = await req.json();
    const { content, operatorId = 'operator' } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'content is required' },
        { status: 400 }
      );
    }

    const message = await EscalationService.replyAsHuman({
      organizationId: orgId,
      escalationId,
      content,
      operatorId,
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Error replying as human:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
