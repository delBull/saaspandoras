import { NextResponse } from 'next/server';
import { db } from '@saasfly/db-core';
import { nexusDealRooms, resourceShares } from '@saasfly/db-core/schema';
import { and, desc, eq, inArray, isNull, or, gt } from '@saasfly/db-core';
import { resolveAgentContext } from '@/lib/nexus/agent-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `GET /api/agent/deal-rooms`
 *
 * Salas que el agente puede consultar: las de su delegación (`scope.rooms`, por
 * `publicId`) más las compartidas por su dueño. No expone firmantes ni firmas:
 * para eso hace falta el detalle y un permiso distinto.
 */
export async function GET(req: Request) {
  const context = await resolveAgentContext(req.headers);
  if (!context) {
    return NextResponse.json({ ok: false, error: 'AGENT_UNAUTHORIZED' }, { status: 401 });
  }
  if (!context.capabilities.includes('dealroom')) {
    return NextResponse.json(
      { ok: false, error: 'CAPABILITY_REQUIRED', required: 'dealRoom' },
      { status: 403 },
    );
  }

  const now = new Date();

  const shared = await db
    .select({ resourceId: resourceShares.resourceId })
    .from(resourceShares)
    .where(
      and(
        eq(resourceShares.sharedWithCollabId, context.collaboratorId),
        eq(resourceShares.resourceType, 'room'),
        eq(resourceShares.status, 'ACTIVE'),
        or(isNull(resourceShares.expiresAt), gt(resourceShares.expiresAt, now)),
      ),
    )
    .limit(200);

  const allowed = new Set<string>([
    ...((context.scope.rooms ?? []) as string[]).map(String),
    ...shared.map((row) => String(row.resourceId)),
  ]);

  if (allowed.size === 0) {
    return NextResponse.json({ ok: true, rooms: [], note: 'Sin salas delegadas ni compartidas.' });
  }

  const rooms = await db
    .select({
      publicId: nexusDealRooms.publicId,
      title: nexusDealRooms.title,
      kind: nexusDealRooms.kind,
      status: nexusDealRooms.status,
      counterparty: nexusDealRooms.counterparty,
      updatedAt: nexusDealRooms.updatedAt,
    })
    .from(nexusDealRooms)
    .where(inArray(nexusDealRooms.publicId, Array.from(allowed)))
    .orderBy(desc(nexusDealRooms.updatedAt))
    .limit(100);

  return NextResponse.json({ ok: true, count: rooms.length, rooms });
}
