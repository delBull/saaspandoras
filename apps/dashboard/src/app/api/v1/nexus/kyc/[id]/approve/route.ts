import { NextResponse } from 'next/server';
import { db } from '@/db';
import { nexusActionRequests, nexusAuditEvents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NexusAuthorizationService } from '@/lib/pandoras/core/domains/nexus/nexus-authorization';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actionRequestId = parseInt(id);
    if (isNaN(actionRequestId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canonicalOrgId = req.headers.get('x-canonical-org-id');
    const actorId = req.headers.get('x-actor-id');
    const telegramUserId = req.headers.get('x-telegram-user-id');

    if (!canonicalOrgId || !actorId) {
      return NextResponse.json({ error: 'Missing required canonical identity headers' }, { status: 400 });
    }

    const secureNexusScope = await NexusAuthorizationService.resolveCollaboratorScope(
      canonicalOrgId,
      actorId,
      telegramUserId ? parseInt(telegramUserId) : undefined
    );

    if (!secureNexusScope) {
      return NextResponse.json({ error: 'Unauthorized: Actor lacks Nexus access' }, { status: 403 });
    }

    // 1. Fetch the request
    const actionRequest = await db.query.nexusActionRequests.findFirst({
      where: and(
        eq(nexusActionRequests.id, actionRequestId),
        eq(nexusActionRequests.canonicalOrgId, secureNexusScope.canonicalOrgId)
      )
    });

    if (!actionRequest) {
      return NextResponse.json({ error: 'Action Request not found' }, { status: 404 });
    }

    if (actionRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Action Request already consumed or expired' }, { status: 409 });
    }

    // 2. Capability check
    if (!secureNexusScope.permissions['nexus.manage'] && !secureNexusScope.permissions['compliance.manage']) {
      return NextResponse.json({ error: `Forbidden: Missing required capability` }, { status: 403 });
    }

    // 3. Perform Execution
    // Example Execution: Updating the action request status to completed
    await db.update(nexusActionRequests)
      .set({
        status: 'COMPLETED',
        result: 'APPROVED',
        completedAt: new Date(),
        consumedAt: new Date()
      })
      .where(eq(nexusActionRequests.id, actionRequestId));

    // 4. Audit Event Logging
    await db.insert(nexusAuditEvents).values({
      actorIdentityId: parseInt(actorId), // Assume actorId is a string representation of ID
      canonicalOrgId: secureNexusScope.canonicalOrgId,
      eventType: 'ACTION_EXECUTION',
      resourceType: 'nexus_action_request',
      resourceId: actionRequestId.toString(),
      action: 'APPROVE',
      previousState: { status: 'PENDING' },
      newState: { status: 'COMPLETED', result: 'APPROVED' },
      result: 'SUCCESS'
    });

    return NextResponse.json({ success: true, message: 'KYC Approved successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('[Nexus KYC Approve Endpoint] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
