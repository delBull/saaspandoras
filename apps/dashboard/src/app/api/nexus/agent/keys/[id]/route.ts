import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';
import { requireNexusAdmin } from '@saasfly/hermes-core/src/nexus/collaborators-service';
import { revokeAgentKey } from '@/lib/nexus/agent-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `POST /api/nexus/agent/keys/[id]` { reason? }
 *
 * Revoca una clave de agente. El dueño puede revocar la suya; un admin puede
 * revocar cualquiera (emergencia: máquina comprometida).
 *
 * Revocar la clave mata sus delegaciones por `on delete cascade` y, sobre todo,
 * corta el acceso en la **siguiente** petición: no hay caché de permisos.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getNexusAuthContext(req.headers);
  if (!auth.isAuthenticated || !auth.collaboratorId) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  let body: { reason?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const isAdmin = await requireNexusAdmin(req);
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, 300) : null;

  const revoked = await revokeAgentKey({
    keyId: (await params).id,
    collaboratorId: isAdmin ? null : auth.collaboratorId,
    reason,
  });

  if (!revoked) {
    return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, revoked });
}
