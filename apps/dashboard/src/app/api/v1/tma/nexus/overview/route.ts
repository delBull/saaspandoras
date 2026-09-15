/**
 * GET /api/v1/tma/nexus/overview
 *
 * Returns the tenant context, enabledVerticals, capability badges and
 * workspace list for the authenticated TMA collaborator.
 * This is the entry-point payload that drives Phase 5 dynamic UI.
 */
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, and, count } from 'drizzle-orm';
import {
  nexusActionRequests,
  hermesEscalations,
  marketingLeads,
  projectCollaborators,
  projects,
} from '@/db/schema';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';

export async function GET(req: Request) {
  try {
    const authCtx = await getNexusAuthContext(new Headers(req.headers));

    if (!authCtx.isAuthenticated || !authCtx.collaboratorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { permissions, canonicalOrgId, collaboratorId, role, name } = authCtx;

    // ── 1. Resolve workspace list (orgs this collaborator belongs to) ──────────
    const projectAssignments = await db
      .select({
        projectId: projectCollaborators.projectId,
        projectTitle: projects.title,
      })
      .from(projectCollaborators)
      .innerJoin(projects, eq(projects.slug, projectCollaborators.projectId))
      .where(eq(projectCollaborators.collaboratorId, collaboratorId!))
      .limit(10);

    const workspaces = projectAssignments.map((p) => ({
      id: p.projectId,
      name: p.projectTitle ?? p.projectId,
    }));

    // Add the canonical org if SUPER_ADMIN and not already listed
    if (role === 'SUPER_ADMIN' && !workspaces.find((w) => w.id === 'pandoras')) {
      workspaces.unshift({ id: 'pandoras', name: 'Pandoras HQ' });
    }

    // ── 2. Derive enabled verticals from permissions ───────────────────────────
    const enabledVerticals: string[] = [];
    if (permissions['nexus.manage']) enabledVerticals.push('HERMES');
    if (permissions['growth.manage'] || permissions['marketing.manage'])
      enabledVerticals.push('GROWTH');
    if (permissions['finance.manage']) enabledVerticals.push('RWA');

    // ── 3. Badge counts (parallel queries, one per vertical enabled) ──────────
    const orgId = canonicalOrgId ?? 'pandoras';

    const [hermesCount, growthCount, financeCount] = await Promise.all([
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
    ]);

    const badges = {
      hitlUrgentChats: Number(hermesCount),
      growthHotLeadsToday: Number(growthCount),
      rwaPendingDeposits: Number(financeCount),
      total: Number(hermesCount) + Number(growthCount) + Number(financeCount),
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
