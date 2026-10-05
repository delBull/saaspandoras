/**
 * 🎓 Academy Managers Admin API
 * apps/dashboard/src/app/api/admin/academy/managers/route.ts
 *
 * Replaces the static ACADEMY_MANAGERS env var with dynamic DB-backed management.
 * Source of truth: nexus_collaborators.permissions.academyAdmin = true
 *
 * Auth: SUPER_ADMIN or ADMIN only (getNexusAuthContext)
 *
 * GET  → List all collaborators with academyAdmin permission or role MANAGER
 * POST → Grant academyAdmin to a collaborator (by collaboratorId or email)
 * DELETE → Revoke academyAdmin from a collaborator
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, nexusCollaborators } from '@saasfly/db-core';
import { eq } from '@saasfly/db-core';
import { getNexusAuthContext } from '@saasfly/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type NexusPermissionsOverride = Record<string, boolean>;

// ── Auth Guard ────────────────────────────────────────────────────────────────
async function requireAdminAuth(req: NextRequest) {
  const auth = await getNexusAuthContext(req.headers);
  if (!auth.isAuthenticated) {
    return { error: 'Unauthorized', status: 401 as const, auth: null };
  }
  if (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN') {
    return { error: 'Forbidden: requires SUPER_ADMIN or ADMIN role', status: 403 as const, auth: null };
  }
  return { error: null, status: 200 as const, auth };
}
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { error, status } = await requireAdminAuth(req);
  if (error) return NextResponse.json({ ok: false, error }, { status });

  try {
    const collaborators = await db.select().from(nexusCollaborators);

    const managers = collaborators
      .filter((c) => {
        const perms = c.permissions as NexusPermissionsOverride | null;
        const isAcademyAdmin = perms?.academyAdmin === true;
        const isManagerRole = (c.role as string) === 'MANAGER';
        return isAcademyAdmin || isManagerRole;
      })
      .map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        role: c.role,
        status: c.status,
        academyAdmin: (c.permissions as NexusPermissionsOverride | null)?.academyAdmin === true,
        lastAccessAt: c.lastAccessAt?.toISOString() ?? null,
      }));

    return NextResponse.json({ ok: true, managers });
  } catch (err: any) {
    console.error('[Academy Managers GET]:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error, status } = await requireAdminAuth(req);
  if (error) return NextResponse.json({ ok: false, error }, { status });

  try {
    const body = await req.json();
    const { collaboratorId, email } = body;

    if (!collaboratorId && !email) {
      return NextResponse.json(
        { ok: false, error: 'collaboratorId or email is required' },
        { status: 400 }
      );
    }

    // Resolve collaborator
    let collab = collaboratorId
      ? await db.query.nexusCollaborators.findFirst({
          where: eq(nexusCollaborators.id, Number(collaboratorId)),
        })
      : await db.query.nexusCollaborators.findFirst({
          where: eq(nexusCollaborators.email, email.toLowerCase()),
        });

    if (!collab) {
      return NextResponse.json({ ok: false, error: 'Collaborator not found' }, { status: 404 });
    }

    // Merge academyAdmin into existing permissions
    const currentPerms = (collab.permissions as NexusPermissionsOverride | null) ?? {};
    const updatedPerms: NexusPermissionsOverride = { ...currentPerms, academyAdmin: true };

    await db
      .update(nexusCollaborators)
      .set({ permissions: updatedPerms })
      .where(eq(nexusCollaborators.id, collab.id));

    return NextResponse.json({
      ok: true,
      message: `Academy admin granted to ${collab.name} (${collab.email})`,
      collaboratorId: collab.id,
    });
  } catch (err: any) {
    console.error('[Academy Managers POST]:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error, status } = await requireAdminAuth(req);
  if (error) return NextResponse.json({ ok: false, error }, { status });

  try {
    const body = await req.json();
    const { collaboratorId } = body;

    if (!collaboratorId) {
      return NextResponse.json({ ok: false, error: 'collaboratorId is required' }, { status: 400 });
    }

    const collab = await db.query.nexusCollaborators.findFirst({
      where: eq(nexusCollaborators.id, Number(collaboratorId)),
    });

    if (!collab) {
      return NextResponse.json({ ok: false, error: 'Collaborator not found' }, { status: 404 });
    }

    const currentPerms = (collab.permissions as NexusPermissionsOverride | null) ?? {};
    const updatedPerms: NexusPermissionsOverride = { ...currentPerms, academyAdmin: false };

    await db
      .update(nexusCollaborators)
      .set({ permissions: updatedPerms })
      .where(eq(nexusCollaborators.id, collab.id));

    return NextResponse.json({
      ok: true,
      message: `Academy admin revoked from ${collab.name} (${collab.email})`,
      collaboratorId: collab.id,
    });
  } catch (err: any) {
    console.error('[Academy Managers DELETE]:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
