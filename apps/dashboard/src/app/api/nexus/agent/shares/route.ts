import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db-core';
import {
  nexusCollaborators,
  nexusDealPods,
  nexusDealRooms,
  projects,
  resourceShares,
} from '@saasfly/db-core/schema';
import { and, desc, eq, gt, isNull, or } from '@saasfly/db-core';
import { requireNexusAdmin } from '@saasfly/hermes-core/src/nexus/collaborators-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Tipos de recurso que se pueden compartir. */
const RESOURCE_TYPES = ['pod', 'room', 'project'] as const;
type ResourceType = (typeof RESOURCE_TYPES)[number];

/**
 * Recursos compartidos (ADR-021 fase 3).
 *
 *   GET  → shares activos (admin)
 *   POST → conceder a un colaborador un recurso concreto, por capability y con
 *          expiración. El `approved_by` es quien lo concede: el dueño del recurso.
 *
 * Se valida que el recurso **exista** para que un typo no cree un permiso huérfano.
 */
export async function GET(req: Request) {
  const isAdmin = await requireNexusAdmin(req);
  if (!isAdmin) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });

  const now = new Date();
  const rows = await db
    .select({
      id: resourceShares.id,
      resourceType: resourceShares.resourceType,
      resourceId: resourceShares.resourceId,
      capabilities: resourceShares.capabilities,
      status: resourceShares.status,
      approvedBy: resourceShares.approvedBy,
      approvedAt: resourceShares.approvedAt,
      expiresAt: resourceShares.expiresAt,
      collaboratorId: resourceShares.sharedWithCollabId,
      collaboratorName: nexusCollaborators.name,
      collaboratorEmail: nexusCollaborators.email,
    })
    .from(resourceShares)
    .leftJoin(
      nexusCollaborators,
      eq(nexusCollaborators.id, resourceShares.sharedWithCollabId),
    )
    .where(
      and(
        eq(resourceShares.status, 'ACTIVE'),
        or(isNull(resourceShares.expiresAt), gt(resourceShares.expiresAt, now)),
      ),
    )
    .orderBy(desc(resourceShares.approvedAt))
    .limit(100);

  return NextResponse.json({ ok: true, shares: rows });
}

export async function POST(req: Request) {
  const isAdmin = await requireNexusAdmin(req);
  if (!isAdmin) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });

  const auth = await getNexusAuthContext(req.headers);

  let body: {
    collaboratorId?: unknown;
    resourceType?: unknown;
    resourceId?: unknown;
    capabilities?: unknown;
    days?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
  }

  const collaboratorId = Number(body.collaboratorId);
  const resourceType = String(body.resourceType ?? '') as ResourceType;
  const resourceId = String(body.resourceId ?? '').trim();
  const capabilities = Array.isArray(body.capabilities)
    ? body.capabilities.map((c) => String(c).trim()).filter(Boolean).slice(0, 10)
    : [];
  const days = Math.min(Math.max(1, Number(body.days ?? 30)), 365);

  if (!Number.isInteger(collaboratorId) || collaboratorId <= 0) {
    return NextResponse.json({ ok: false, error: 'INVALID_COLLABORATOR' }, { status: 400 });
  }
  if (!RESOURCE_TYPES.includes(resourceType)) {
    return NextResponse.json({ ok: false, error: 'INVALID_RESOURCE_TYPE' }, { status: 400 });
  }
  if (!resourceId) {
    return NextResponse.json({ ok: false, error: 'MISSING_RESOURCE_ID' }, { status: 400 });
  }
  if (capabilities.length === 0) {
    return NextResponse.json({ ok: false, error: 'MISSING_CAPABILITIES' }, { status: 400 });
  }

  // El recurso debe existir: un typo no puede crear un permiso huérfano.
  const exists =
    resourceType === 'pod'
      ? (await db.select({ code: nexusDealPods.code }).from(nexusDealPods).where(eq(nexusDealPods.code, resourceId)).limit(1)).length > 0
      : resourceType === 'room'
        ? (await db.select({ id: nexusDealRooms.id }).from(nexusDealRooms).where(eq(nexusDealRooms.publicId, resourceId)).limit(1)).length > 0
        : (await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, resourceId)).limit(1)).length > 0;

  if (!exists) {
    return NextResponse.json({ ok: false, error: 'RESOURCE_NOT_FOUND' }, { status: 404 });
  }

  const [collaborator] = await db
    .select({ id: nexusCollaborators.id })
    .from(nexusCollaborators)
    .where(eq(nexusCollaborators.id, collaboratorId))
    .limit(1);

  if (!collaborator) {
    return NextResponse.json({ ok: false, error: 'COLLABORATOR_NOT_FOUND' }, { status: 404 });
  }

  const approvedBy = auth.email || auth.wallet || 'nexus-admin';
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const [created] = await db
    .insert(resourceShares)
    .values({
      resourceType,
      resourceId,
      ownerOrgId: auth.canonicalOrgId || 'pandoras',
      sharedWithCollabId: collaboratorId,
      capabilities,
      status: 'ACTIVE',
      approvedBy,
      expiresAt,
    })
    .onConflictDoNothing()
    .returning();

  if (!created) {
    return NextResponse.json(
      { ok: false, error: 'ALREADY_SHARED', message: 'Ese colaborador ya tiene acceso activo a ese recurso.' },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, share: created }, { status: 201 });
}
