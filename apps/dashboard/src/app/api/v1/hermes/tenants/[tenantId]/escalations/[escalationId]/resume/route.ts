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

    const body = await req.json().catch(() => ({}));
    const { operatorId = 'operator', notes } = body;

    const escalation = await EscalationService.resumeHermes({
      organizationId: orgId,
      escalationId,
      operatorId,
      notes,
    });

    return NextResponse.json({ success: true, escalation });
  } catch (error: any) {
    console.error('Error resuming Hermes control:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
