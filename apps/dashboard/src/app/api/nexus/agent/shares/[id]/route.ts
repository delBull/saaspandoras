import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db-core';
import { resourceShares } from '@saasfly/db-core/schema';
import { eq } from '@saasfly/db-core';
import { requireNexusAdmin } from '@saasfly/hermes-core/src/nexus/collaborators-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `POST /api/nexus/agent/shares/[id]` { reason? }
 *
 * Revoca un recurso compartido. El agente pierde el acceso en la siguiente
 * petición (no hay caché de permisos) y la evidencia queda en la fila revocada.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await requireNexusAdmin(req);
  if (!isAdmin) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });

  const auth = await getNexusAuthContext(req.headers);

  let body: { reason?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const [revoked] = await db
    .update(resourceShares)
    .set({
      status: 'REVOKED',
      revokedAt: new Date(),
      revokeReason:
        (typeof body.reason === 'string' ? body.reason.slice(0, 300) : null) ??
        `revocado por ${auth.email || 'admin'}`,
    })
    .where(eq(resourceShares.id, (await params).id))
    .returning({ id: resourceShares.id, status: resourceShares.status });

  if (!revoked) {
    return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, share: revoked });
}
