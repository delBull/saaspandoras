import { NextResponse } from 'next/server';
import { db } from '@saasfly/db-core';
import { agentActionProposals, nexusCollaborators } from '@saasfly/db-core/schema';
import { desc, eq } from '@saasfly/db-core';
import { requireNexusAdmin } from '@saasfly/hermes-core/src/nexus/collaborators-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** `GET /api/nexus/agent/actions` — propuestas pendientes (sólo admin). */
export async function GET(req: Request) {
  const isAdmin = await requireNexusAdmin(req);
  if (!isAdmin) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });

  const rows = await db
    .select({
      id: agentActionProposals.id,
      action: agentActionProposals.action,
      resourceType: agentActionProposals.resourceType,
      resourceId: agentActionProposals.resourceId,
      payload: agentActionProposals.payload,
      status: agentActionProposals.status,
      proposedBy: agentActionProposals.proposedBy,
      createdAt: agentActionProposals.createdAt,
      collaboratorName: nexusCollaborators.name,
      collaboratorEmail: nexusCollaborators.email,
    })
    .from(agentActionProposals)
    .leftJoin(
      nexusCollaborators,
      eq(nexusCollaborators.id, agentActionProposals.collaboratorId),
    )
    .where(eq(agentActionProposals.status, 'PENDING'))
    .orderBy(desc(agentActionProposals.createdAt))
    .limit(100);

  return NextResponse.json({ ok: true, proposals: rows });
}
