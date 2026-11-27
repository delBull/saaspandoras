import { NextResponse } from 'next/server';
import { db } from '@saasfly/db-core';
import { nexusDealPods, resourceShares } from '@saasfly/db-core/schema';
import { and, eq, inArray, isNull, or, gt } from '@saasfly/db-core';
import { resolveAgentContext } from '@/lib/nexus/agent-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `GET /api/agent/deal-pods`
 *
 * Lista los Deal Pods que el agente puede tocar: los de su delegación **más** los
 * que un dueño le compartió explícitamente (`resource_shares`).
 *
 * Requiere capability `dealRoom`. Si no la tiene, 403; si tiene la capability
 * pero no hay recursos, devuelve lista vacía (no inventa acceso).
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
        eq(resourceShares.resourceType, 'pod'),
        eq(resourceShares.status, 'ACTIVE'),
        or(isNull(resourceShares.expiresAt), gt(resourceShares.expiresAt, now)),
      ),
    )
    .limit(200);

  const allowed = new Set<string>([
    ...((context.scope.pods ?? []) as string[]).map(String),
    ...shared.map((row) => String(row.resourceId)),
  ]);

  if (allowed.size === 0) {
    return NextResponse.json({ ok: true, pods: [], note: 'Sin recursos delegados ni compartidos.' });
  }

  const pods = await db
    .select({
      code: nexusDealPods.code,
      displayName: nexusDealPods.displayName,
      status: nexusDealPods.status,
      confidentiality: nexusDealPods.confidentiality,
    })
    .from(nexusDealPods)
    .where(inArray(nexusDealPods.code, Array.from(allowed)))
    .limit(100);

  return NextResponse.json({ ok: true, count: pods.length, pods });
}
