import { db } from '@saasfly/db';
import { communityProposals, nexusApprovals, projects } from '@saasfly/db/schema';
import { and, desc, eq, inArray } from '@saasfly/db-core';
import ApprovalsClient from './ApprovalsClient';

export const dynamic = 'force-dynamic';

/**
 * Aprobaciones del tenant.
 *
 * El Community Manager crea campañas (u otras acciones gobernadas) y quedan
 * PENDING; aquí el admin las resuelve. La decisión se envía al PATCH
 * `/api/nexus/approvals`, que la vuelve a validar con la sesión del servidor.
 */
export default async function ApprovalsPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;

  const [project] = await db
    .select({ organizationId: projects.organizationId })
    .from(projects)
    .where(eq(projects.slug, organizationSlug))
    .limit(1);

  // Las aprobaciones pueden haberse guardado con el slug o con el id canónico.
  const orgKeys = [organizationSlug, project?.organizationId].filter(Boolean) as string[];

  let approvals: Array<{
    id: string;
    what: string;
    why: string;
    riskLevel: string;
    capabilityRequired: string;
    resourceScope: string;
    proposerName: string;
    createdAt: Date;
  }> = [];

  try {
    approvals = await db
      .select({
        id: nexusApprovals.id,
        what: nexusApprovals.what,
        why: nexusApprovals.why,
        riskLevel: nexusApprovals.riskLevel,
        capabilityRequired: nexusApprovals.capabilityRequired,
        resourceScope: nexusApprovals.resourceScope,
        proposerName: nexusApprovals.proposerName,
        createdAt: nexusApprovals.createdAt,
      })
      .from(nexusApprovals)
      .where(and(
        inArray(nexusApprovals.canonicalOrgId, orgKeys.length > 0 ? orgKeys : [organizationSlug]),
        eq(nexusApprovals.status, 'PENDING'),
        // Ámbito tenant: la operación interna (accesos, agentes) se ve en Nexus.
        eq(nexusApprovals.scope, 'tenant'),
      ))
      .orderBy(desc(nexusApprovals.createdAt))
      .limit(50);
  } catch (err) {
    console.warn('[Approvals] no se pudieron leer:', err);
  }

  // Texto propuesto (community.publish_post): el aprobador debe ver QUÉ aprueba.
  const approvalIds = approvals.map((a) => a.id);
  let proposals: Array<{ approvalId: string | null; posts: Array<{ channel: string; text: string }> }> = [];
  if (approvalIds.length > 0) {
    try {
      proposals = await db
        .select({ approvalId: communityProposals.approvalId, posts: communityProposals.posts })
        .from(communityProposals)
        .where(inArray(communityProposals.approvalId, approvalIds));
    } catch (err) {
      console.warn('[Approvals] no se pudieron leer las propuestas:', err);
    }
  }
  const postsByApproval = new Map(
    proposals.map((p) => [p.approvalId ?? '', p.posts ?? []]),
  );

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">Growth OS</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Aprobaciones</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Acciones propuestas por el equipo que requieren tu autorización. Aprobar aquí es la
            autorización: el servidor vuelve a validar tu sesión antes de ejecutar.
          </p>
        </div>
        <a
          href={`/growth-os/organizations/${organizationSlug}/approvals/historial`}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-zinc-300 hover:bg-white/[0.06]"
        >
          Historial →
        </a>
      </div>

      <ApprovalsClient
        organizationSlug={organizationSlug}
        approvals={approvals.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          posts: postsByApproval.get(a.id) ?? [],
        }))}
      />
    </div>
  );
}
