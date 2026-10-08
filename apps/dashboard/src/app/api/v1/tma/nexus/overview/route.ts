/**
 * GET /api/v1/tma/nexus/overview
 *
 * Returns the tenant context, enabledVerticals, capability badges and
 * workspace list for the authenticated TMA collaborator.
 * This is the entry-point payload that drives Phase 5 dynamic UI.
 */
import { NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { eq, and, count, or } from "@saasfly/db-core";
import {
  nexusActionRequests,
  hermesEscalations,
  marketingLeads,
  projectCollaborators,
  projects,
  nexusTasks,
  nexusCollaborators
} from '@saasfly/db/schema';
import { resolveEffectivePermissions, type NexusRole } from '@saasfly/shared';
import { cookies } from 'next/headers';
import { ActorIdentityBindingService, type BoundActorSession } from '@saasfly/hermes-core';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionStr = cookieStore.get('nexus_tma_session')?.value;

    if (!sessionStr) {
      return NextResponse.json({ error: 'Unauthorized - Missing Session Cookie' }, { status: 401 });
    }

    let boundSession: BoundActorSession;
    try {
      boundSession = JSON.parse(sessionStr);
    } catch {
      return NextResponse.json({ error: 'Unauthorized - Invalid Session Format' }, { status: 401 });
    }

    const isValid = ActorIdentityBindingService.validateSession(boundSession);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized - Invalid or Expired Session' }, { status: 401 });
    }

    const collaboratorId = parseInt(boundSession.actorId, 10);
    const orgId = boundSession.tenantId || 'pandoras';

    const collabRecord = await db.query.nexusCollaborators.findFirst({
      where: eq(nexusCollaborators.id, collaboratorId)
    });

    if (!collabRecord || collabRecord.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Unauthorized - Inactive Collaborator' }, { status: 403 });
    }

    const role = collabRecord.role as NexusRole;
    const name = collabRecord.name;
    const permissions = resolveEffectivePermissions(
      role,
      collabRecord.permissions as Record<string, boolean> | null,
      'TMA'
    );

    // ── 1. Resolve workspace list (orgs this collaborator belongs to) ──────────
    const projectAssignments = await db
      .select({
        projectId: projectCollaborators.projectId,
        projectTitle: projects.title,
      })
      .from(projectCollaborators)
      .innerJoin(projects, eq(projects.slug, projectCollaborators.projectId))
      .where(eq(projectCollaborators.collaboratorId, collaboratorId))
      .limit(10);

    const workspaces = projectAssignments.map((p) => ({
      id: p.projectId,
      name: p.projectTitle ?? p.projectId,
    }));

    // Add the canonical org if ecosystem is true and not already listed
    if (permissions.ecosystem && !workspaces.find((w) => w.id === 'pandoras')) {
      workspaces.unshift({ id: 'pandoras', name: 'Pandoras HQ' });
    }

    // ── 2. Derive enabled verticals from permissions ───────────────────────────
    const enabledVerticals: string[] = [];
    if (permissions['nexus.manage']) enabledVerticals.push('HERMES');
    if (permissions['growth.manage'] || permissions['marketing.manage'])
      enabledVerticals.push('GROWTH');
    if (permissions['finance.manage']) enabledVerticals.push('RWA');

    // ── 3. Badge counts (parallel queries, one per vertical enabled) ──────────

    const [hermesCount, growthCount, financeCount, tasksCount] = await Promise.all([
      // HERMES badge: PENDING escalations
      enabledVerticals.includes('HERMES')
        ? db
            .select({ n: count() })
            .from(hermesEscalations)
            .where(
              and(
                eq(hermesEscalations.organizationId, orgId),
                eq(hermesEscalations.status, 'PENDING')
              )
            )
            .then((r) => r[0]?.n ?? 0)
        : Promise.resolve(0),

      // GROWTH badge: leads assigned to this org
      enabledVerticals.includes('GROWTH')
        ? db
            .select({ n: count() })
            .from(marketingLeads)
            .innerJoin(projects, eq(projects.id, marketingLeads.projectId))
            .where(eq(projects.slug, orgId))
            .then((r) => r[0]?.n ?? 0)
        : Promise.resolve(0),

      // RWA badge: PENDING action requests (deposits/approvals)
      enabledVerticals.includes('RWA')
        ? db
            .select({ n: count() })
            .from(nexusActionRequests)
            .where(
              and(
                eq(nexusActionRequests.canonicalOrgId, orgId),
                eq(nexusActionRequests.status, 'PENDING')
              )
            )
            .then((r) => r[0]?.n ?? 0)
        : Promise.resolve(0),

      // TASKS badge: open or in-progress tasks assigned to the user
      db
        .select({ n: count() })
        .from(nexusTasks)
        .where(
          and(
            eq(nexusTasks.canonicalOrgId, orgId),
            eq(nexusTasks.assigneeCollaboratorId, collaboratorId),
            or(eq(nexusTasks.status, 'OPEN'), eq(nexusTasks.status, 'IN_PROGRESS'))
          )
        )
        .then((r) => r[0]?.n ?? 0),
    ]);

    const badges = {
      hitlUrgentChats: Number(hermesCount),
      growthHotLeadsToday: Number(growthCount),
      rwaPendingDeposits: Number(financeCount),
      myActiveTasks: Number(tasksCount),
      total: Number(hermesCount) + Number(growthCount) + Number(financeCount) + Number(tasksCount),
    };

    return NextResponse.json({
      collaborator: {
        id: collaboratorId,
        name,
        role,
        canonicalOrgId: orgId,
      },
      workspaces,
      activeWorkspace: orgId,
      enabledVerticals,
      capabilities: Object.entries(permissions)
        .filter(([, v]) => v)
        .map(([k]) => k),
      badges,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[NexusTMAOverview] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
