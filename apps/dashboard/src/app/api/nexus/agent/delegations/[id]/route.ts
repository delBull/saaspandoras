import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';
import { requireNexusAdmin } from '@saasfly/hermes-core/src/nexus/collaborators-service';
import { decideDelegation } from '@/lib/nexus/agent-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `POST /api/nexus/agent/delegations/[id]` { decision, reason? }
 *
 *   APPROVE → la delegación pasa a ACTIVE (sólo admin/owner)
 *   REJECT  → queda rechazada
 *   REVOKE  → se corta en la siguiente petición (admin u dueño)
 *
 * Aprobar **no** crea capacidades: sólo activa las que ya se validaron contra
 * los permisos efectivos de la persona al pedirlas.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getNexusAuthContext(req.headers);
  if (!auth.isAuthenticated || !auth.email) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  let body: { decision?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
  }

  const decision = String(body.decision ?? '').toUpperCase();
  if (!['APPROVE', 'REJECT', 'REVOKE'].includes(decision)) {
    return NextResponse.json({ ok: false, error: 'INVALID_DECISION' }, { status: 400 });
  }

  // Aprobar y rechazar: sólo admin. Revocar: admin o el propio dueño.
  if (decision !== 'REVOKE') {
    const isAdmin = await requireNexusAdmin(req);
    if (!isAdmin) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
  }

  const updated = await decideDelegation({
    id: (await params).id,
    decision: decision as 'APPROVE' | 'REJECT' | 'REVOKE',
    actor: auth.email,
    reason: typeof body.reason === 'string' ? body.reason.slice(0, 300) : null,
  });

  if (!updated) {
    return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, delegation: updated });
}
