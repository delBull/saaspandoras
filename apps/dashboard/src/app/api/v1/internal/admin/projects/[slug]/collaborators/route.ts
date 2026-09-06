import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projectCollaborators, nexusCollaborators } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';

// GET: Fetch assigned collaborators for a specific project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await getNexusAuthContext(req.headers);
    if (!auth.isAuthenticated || auth.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    const assigned = await db.select({
      collaboratorId: projectCollaborators.collaboratorId,
      assignedAt: projectCollaborators.assignedAt,
      name: nexusCollaborators.name,
      email: nexusCollaborators.email,
    })
    .from(projectCollaborators)
    .innerJoin(nexusCollaborators, eq(projectCollaborators.collaboratorId, nexusCollaborators.id))
    .where(eq(projectCollaborators.projectId, slug));

    return NextResponse.json({ ok: true, data: assigned });
  } catch (error: any) {
    console.error('[Admin Project Collaborators GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

// POST: Assign a collaborator to a project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await getNexusAuthContext(req.headers);
    if (!auth.isAuthenticated || auth.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const { collaboratorId } = await req.json();

    if (!collaboratorId) {
      return NextResponse.json({ error: 'Missing collaboratorId' }, { status: 400 });
    }

    await db.insert(projectCollaborators).values({
      projectId: slug,
      collaboratorId,
    }).onConflictDoNothing(); // If already assigned, ignore

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Admin Project Collaborators POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

// DELETE: Remove a collaborator assignment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await getNexusAuthContext(req.headers);
    if (!auth.isAuthenticated || auth.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const { collaboratorId } = await req.json();

    if (!collaboratorId) {
      return NextResponse.json({ error: 'Missing collaboratorId' }, { status: 400 });
    }

    await db.delete(projectCollaborators).where(
      and(
        eq(projectCollaborators.projectId, slug),
        eq(projectCollaborators.collaboratorId, collaboratorId)
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Admin Project Collaborators DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
