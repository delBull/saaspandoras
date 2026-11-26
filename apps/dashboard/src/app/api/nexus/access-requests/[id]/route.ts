import { NextResponse } from 'next/server';
import { db } from '@saasfly/db-core';
import { nexusAccessRequests, nexusCollaborators } from '@saasfly/db-core/schema';
import { eq } from '@saasfly/db-core';
import { requireNexusAdmin } from '@saasfly/hermes-core';
import { getNexusAuthContext } from '@saasfly/shared';
import { ACCESS_MODULES, MODULE_PERMISSION_FIELD, type AccessModule } from '@/lib/nexus/access-modules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `POST /api/nexus/access-requests/[id]` { decision: 'APPROVE' | 'REJECT', note? }
 *
 * Sólo un admin decide. Aprobar escribe el permiso del módulo en el colaborador
 * (`nexus_collaborators.permissions`) y deja constancia de quién lo aprobó.
 *
 * No toca el rol: el permiso de módulo abre un módulo concreto sin ascender a
 * nadie. Ascender de rol es una decisión distinta (Cohorts → Editar).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await requireNexusAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
  }

  const auth = await getNexusAuthContext(req.headers);

  let body: { decision?: unknown; note?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
  }

  const decision = String(body.decision ?? '').toUpperCase();
  if (decision !== 'APPROVE' && decision !== 'REJECT') {
    return NextResponse.json({ ok: false, error: 'INVALID_DECISION' }, { status: 400 });
  }

  const { id } = await params;

  const [request] = await db
    .select()
    .from(nexusAccessRequests)
    .where(eq(nexusAccessRequests.id, id))
    .limit(1);

  if (!request) {
    return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  }
  if (request.status !== 'PENDING') {
    return NextResponse.json(
      { ok: false, error: 'ALREADY_DECIDED', status: request.status },
      { status: 409 },
    );
  }

  const moduleKey = request.module as AccessModule;
  if (!ACCESS_MODULES.includes(moduleKey)) {
    return NextResponse.json({ ok: false, error: 'INVALID_MODULE' }, { status: 400 });
  }

  const decidedBy = auth.email || auth.wallet || 'nexus-admin';
  const note = typeof body.note === 'string' ? body.note.slice(0, 500) : null;

  if (decision === 'APPROVE') {
    const [collaborator] = await db
      .select({ permissions: nexusCollaborators.permissions })
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.id, request.collaboratorId))
      .limit(1);

    if (!collaborator) {
      return NextResponse.json({ ok: false, error: 'COLLABORATOR_NOT_FOUND' }, { status: 404 });
    }

    const field = MODULE_PERMISSION_FIELD[moduleKey];
    const permissions = { ...((collaborator.permissions ?? {}) as Record<string, boolean>), [field]: true };

    await db
      .update(nexusCollaborators)
      .set({ permissions })
      .where(eq(nexusCollaborators.id, request.collaboratorId));
  }

  const [updated] = await db
    .update(nexusAccessRequests)
    .set({
      status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      decidedAt: new Date(),
      decidedBy,
      decisionNote: note,
    })
    .where(eq(nexusAccessRequests.id, id))
    .returning();

  return NextResponse.json({
    ok: true,
    request: updated,
    permissionGranted: decision === 'APPROVE' ? MODULE_PERMISSION_FIELD[moduleKey] : null,
  });
}
