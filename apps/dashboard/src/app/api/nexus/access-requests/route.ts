import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db-core';
import { nexusAccessRequests, nexusCollaborators } from '@saasfly/db-core/schema';
import { and, desc, eq } from '@saasfly/db-core';
import { requireNexusAdmin } from '@saasfly/hermes-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { ACCESS_MODULES, MODULE_PERMISSION_FIELD, type AccessModule } from '@/lib/nexus/access-modules';

/**
 * Bandeja de solicitudes de acceso a módulos de Nexus.
 *
 *   GET  → pendientes (o las últimas con ?status=ALL). Sólo admin.
 *   POST → crea la solicitud del colaborador autenticado (idempotente por el
 *          índice único parcial email+módulo con status PENDING).
 */
export async function GET(req: Request) {
  const isAdmin = await requireNexusAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
  }

  const status = new URL(req.url).searchParams.get('status') ?? 'PENDING';

  const query = db.select().from(nexusAccessRequests);
  const rows =
    status === 'ALL'
      ? await query.orderBy(desc(nexusAccessRequests.requestedAt)).limit(100)
      : await query
          .where(eq(nexusAccessRequests.status, status))
          .orderBy(desc(nexusAccessRequests.requestedAt))
          .limit(100);

  return NextResponse.json({ ok: true, requests: rows });
}

export async function POST(req: Request) {
  const auth = await getNexusAuthContext(req.headers);
  if (!auth.isAuthenticated || !auth.email) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  let body: { module?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
  }

  const moduleKey = String(body.module ?? '').trim() as AccessModule;
  if (!ACCESS_MODULES.includes(moduleKey)) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_MODULE', allowed: ACCESS_MODULES },
      { status: 400 },
    );
  }

  const email = auth.email.toLowerCase().trim();

  const [collaborator] = await db
    .select({
      id: nexusCollaborators.id,
      name: nexusCollaborators.name,
      role: nexusCollaborators.role,
      permissions: nexusCollaborators.permissions,
    })
    .from(nexusCollaborators)
    .where(eq(nexusCollaborators.email, email))
    .limit(1);

  if (!collaborator) {
    return NextResponse.json({ ok: false, error: 'COLLABORATOR_NOT_FOUND' }, { status: 404 });
  }

  const field = MODULE_PERMISSION_FIELD[moduleKey];
  const role = String(collaborator.role ?? 'COLLABORATOR').toUpperCase();
  const perms = (collaborator.permissions ?? {}) as Record<string, boolean>;

  const grantedByRole = moduleKey === 'developer' && (role === 'ADMIN' || role === 'SUPER_ADMIN');
  if (perms[field] === true || grantedByRole) {
    // No se molesta al owner si la persona ya puede entrar.
    return NextResponse.json({ ok: true, alreadyGranted: true });
  }

  const [created] = await db
    .insert(nexusAccessRequests)
    .values({
      collaboratorId: collaborator.id,
      email,
      name: collaborator.name || auth.name || email,
      role,
      module: moduleKey,
      message: typeof body.message === 'string' ? body.message.slice(0, 1000) : null,
    })
    .onConflictDoNothing()
    .returning();

  if (created) {
    return NextResponse.json({ ok: true, request: created }, { status: 201 });
  }

  const [pending] = await db
    .select()
    .from(nexusAccessRequests)
    .where(
      and(
        eq(nexusAccessRequests.email, email),
        eq(nexusAccessRequests.module, moduleKey),
        eq(nexusAccessRequests.status, 'PENDING'),
      ),
    )
    .limit(1);

  return NextResponse.json({ ok: true, request: pending ?? null, duplicate: true });
}
