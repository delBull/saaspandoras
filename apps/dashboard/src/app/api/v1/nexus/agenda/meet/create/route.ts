import { NextRequest, NextResponse } from 'next/server';
import { getNexusAuthContext, checkNexusPermission } from '@saasfly/shared';
import { AgendaCore } from '@saasfly/agenda-sdk';

export const runtime = 'nodejs';

/**
 * 🏛️ ARCHITECTURE NOTE: Sovereign Agenda Core (v1.0 Decoupling)
 * =============================================================
 * This endpoint acts as the Nexus adapter for meeting creation.
 * It delegates the actual domain logic to the shared `@saasfly/agenda-sdk` package.
 */

export async function POST(req: NextRequest) {
  try {
    // 1. Resolve Identity and Permissions
    const auth = await getNexusAuthContext(req.headers);
    if (!auth || !auth.collaboratorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkNexusPermission(auth, 'calendar.manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse Request
    const body = await req.json();
    const { scheduledFor, presentationId, collaborators } = body;

    const orgId = auth.canonicalOrgId || 'default';

    // 3. Delegate to AgendaCore
    const meeting = await AgendaCore.createMeeting({
        canonicalOrgId: orgId,
        hostCollaboratorId: auth.collaboratorId,
        presentationId,
        scheduledFor,
        collaborators
    });

    // 4. Return Meeting Data
    return NextResponse.json({
      success: true,
      meeting
    });

  } catch (error: any) {
    console.error('[MeetCreate] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
