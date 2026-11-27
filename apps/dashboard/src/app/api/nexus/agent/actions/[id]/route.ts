import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db-core';
import { agentActionProposals } from '@saasfly/db-core/schema';
import { eq } from '@saasfly/db-core';
import { requireNexusAdmin } from '@saasfly/hermes-core/src/nexus/collaborators-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `POST /api/nexus/agent/actions/[id]` { decision: 'APPROVE' | 'REJECT', note? }
 *
 * Un humano decide sobre la propuesta del agente. **Aprobar no ejecuta nada por
 * sí solo**: la mutación se aplica por el flujo normal (UI/API del recurso), con
 * su propia validación. Así el agente nunca es un camino de ejecución paralelo.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await requireNexusAdmin(req);
  if (!isAdmin) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });

  const auth = await getNexusAuthContext(req.headers);

  let body: { decision?: unknown; note?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
  }

  const decision = String(body.decision ?? '').toUpperCase();
  if (!['APPROVE', 'REJECT'].includes(decision)) {
    return NextResponse.json({ ok: false, error: 'INVALID_DECISION' }, { status: 400 });
  }

  const [row] = await db
    .update(agentActionProposals)
    .set({
      status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      decidedBy: auth.email || auth.wallet || 'nexus-admin',
      decidedAt: new Date(),
      decisionNote: typeof body.note === 'string' ? body.note.slice(0, 500) : null,
    })
    .where(eq(agentActionProposals.id, (await params).id))
    .returning();

  if (!row) {
    return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    proposal: row,
    executed: false,
    note: 'Decisión registrada. La mutación se aplica desde el flujo normal del recurso.',
  });
}
