import Link from 'next/link';
import { db } from '@saasfly/db';
import { communityProposals, nexusApprovals, nexusOutreachEvents, nexusOutreachLinks, projects } from '@saasfly/db/schema';
import { and, desc, eq, inArray, sql } from '@saasfly/db-core';
import {
  formatHours,
  formatRate,
  summarizeDecisions,
  topReasons,
  type DecisionRow,
} from '@/lib/growth/approval-history';

export const dynamic = 'force-dynamic';

/**
 * Historial de decisiones (aprobadas / rechazadas).
 *
 * Sólo lectura: no crea almacén nuevo, lee lo que ya quedó registrado en
 * `nexus_approvals` y, para comunidad, el motivo y los clics por publicación.
 */
export default async function ApprovalHistoryPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;

  const [project] = await db
    .select({ organizationId: projects.organizationId })
    .from(projects)
    .where(eq(projects.slug, organizationSlug))
    .limit(1);

  const orgKeys = [organizationSlug, project?.organizationId].filter(Boolean) as string[];
  const scope = orgKeys.length > 0 ? orgKeys : [organizationSlug];

  let decided: Array<{
    id: string;
    what: string;
    why: string;
    status: string;
    proposerName: string;
    createdAt: Date;
    resolvedAt: Date | null;
  }> = [];

  try {
    decided = await db
      .select({
        id: nexusApprovals.id,
        what: nexusApprovals.what,
        why: nexusApprovals.why,
        status: nexusApprovals.status,
        proposerName: nexusApprovals.proposerName,
        createdAt: nexusApprovals.createdAt,
        resolvedAt: nexusApprovals.resolvedAt,
      })
      .from(nexusApprovals)
      .where(and(
        inArray(nexusApprovals.canonicalOrgId, scope),
        inArray(nexusApprovals.status, ['APPROVED', 'REJECTED']),
      ))
      .orderBy(desc(nexusApprovals.resolvedAt))
      .limit(100);
  } catch (err) {
    console.warn('[ApprovalHistory] no se pudo leer el historial:', err);
  }

  const approvalIds = decided.map((row) => row.id);
  let proposals: Array<{
    approvalId: string | null;
    intent: string | null;
    status: string;
    posts: Array<{ channel: string; text: string; code?: string }>;
    result: unknown;
  }> = [];

  if (approvalIds.length > 0) {
    try {
      proposals = await db
        .select({
          approvalId: communityProposals.approvalId,
          intent: communityProposals.intent,
          status: communityProposals.status,
          posts: communityProposals.posts,
          result: communityProposals.result,
        })
        .from(communityProposals)
        .where(inArray(communityProposals.approvalId, approvalIds));
    } catch (err) {
      console.warn('[ApprovalHistory] no se pudieron leer las propuestas:', err);
    }
  }

  const proposalByApproval = new Map(
    proposals.filter((p) => p.approvalId).map((p) => [p.approvalId as string, p]),
  );

  // Clics por publicación (sólo las que llegaron a publicarse).
  const codes = Array.from(new Set(
    proposals.flatMap((p) => (p.posts ?? []).map((post) => post.code).filter(Boolean) as string[]),
  ));

  const opensByCode = new Map<string, number>();
  if (codes.length > 0) {
    try {
      const stats = await db
        .select({
          code: nexusOutreachLinks.code,
          opens: sql<number>`count(${nexusOutreachEvents.id})::int`,
        })
        .from(nexusOutreachLinks)
        .leftJoin(nexusOutreachEvents, and(
          eq(nexusOutreachEvents.linkId, nexusOutreachLinks.id),
          eq(nexusOutreachEvents.event, 'OPEN'),
        ))
        .where(inArray(nexusOutreachLinks.code, codes))
        .groupBy(nexusOutreachLinks.code);

      for (const stat of stats) opensByCode.set(stat.code, Number(stat.opens));
    } catch (err) {
      console.warn('[ApprovalHistory] no se pudieron leer los clics:', err);
    }
  }

  // `result` es jsonb: se lee con cuidado en vez de asumir su forma.
  const resultField = (approvalId: string, key: 'reason' | 'errors'): unknown => {
    const result = proposalByApproval.get(approvalId)?.result as Record<string, unknown> | null | undefined;
    return result?.[key];
  };

  const decisionRows: DecisionRow[] = decided.map((row) => {
    const errors = resultField(row.id, 'errors');
    return {
      status: row.status,
      createdAt: row.createdAt,
      resolvedAt: row.resolvedAt,
      reason:
        (typeof resultField(row.id, 'reason') === 'string'
          ? (resultField(row.id, 'reason') as string)
          : null) ??
        (Array.isArray(errors) ? ((errors as string[])[0] ?? null) : null),
    };
  });

  const summary = summarizeDecisions(decisionRows);
  const reasons = topReasons(decisionRows);

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">Growth OS</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Historial de decisiones</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Lo que ya se aprobó y lo que se rechazó, con el motivo. Sirve para ver si el agente está
            proponiendo bien y qué publicaciones traen clics.
          </p>
        </div>
        <Link
          href={`/growth-os/organizations/${organizationSlug}/approvals`}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-zinc-300 hover:bg-white/[0.06]"
        >
          ← Pendientes
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Decididas', value: String(summary.total) },
          { label: 'Aprobadas', value: String(summary.approved) },
          { label: 'Tasa de aprobación', value: formatRate(summary.approvalRate) },
          { label: 'Mediana hasta decidir', value: formatHours(summary.medianHours) },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {reasons.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300/80">
            Motivos de rechazo repetidos
          </p>
          <ul className="mt-3 space-y-1">
            {reasons.map((item) => (
              <li key={item.reason} className="flex items-baseline justify-between gap-3 text-[12px] text-zinc-300">
                <span className="min-w-0">{item.reason}</span>
                <span className="shrink-0 font-mono text-[11px] text-amber-300/70">×{item.count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-zinc-500">
            Si un motivo se repite, debería convertirse en regla del validador y dejar de llegar a tu bandeja.
          </p>
        </div>
      )}

      {decided.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-sm font-semibold text-white">Aún no hay decisiones</p>
          <p className="mt-1 text-[12px] text-zinc-500">
            Cuando apruebes o rechaces algo, quedará aquí con su motivo y sus clics.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left">
            <thead className="bg-white/[0.03] text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-4 py-3">Decidido</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Propuesta</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">Clics</th>
                <th className="px-4 py-3">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {decided.map((row) => {
                const proposal = proposalByApproval.get(row.id);
                const channel = proposal?.posts?.[0]?.channel;
                const code = proposal?.posts?.[0]?.code;
                const opens = code ? opensByCode.get(code) : undefined;
                const isApproved = row.status === 'APPROVED';
                const reasonValue = resultField(row.id, 'reason');
                const reason = typeof reasonValue === 'string' ? reasonValue : undefined;

                return (
                  <tr key={row.id} className="text-[12px] text-zinc-300">
                    <td className="whitespace-nowrap px-4 py-3 text-[11px] text-zinc-500">
                      {(row.resolvedAt ?? row.createdAt).toLocaleString('es-MX', {
                        timeZone: 'America/Mexico_City',
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                          isApproved
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                            : 'border-red-500/40 bg-red-500/10 text-red-300'
                        }`}
                      >
                        {isApproved ? 'APROBADA' : 'RECHAZADA'}
                      </span>
                      {proposal?.status === 'BLOCKED' && (
                        <span className="ml-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-amber-300">
                          BLOQUEADA
                        </span>
                      )}
                    </td>
                    <td className="max-w-[22rem] px-4 py-3">
                      {proposal?.intent ?? row.why}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-zinc-400">{channel ? `#${channel}` : '—'}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">
                      {typeof opens === 'number' ? opens : '—'}
                    </td>
                    <td className="max-w-[18rem] px-4 py-3 text-[11px] text-zinc-400">
                      {reason ? reason : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-[11px] text-zinc-600">
        Los clics cuentan aperturas del enlace <span className="font-mono">/l/&lt;code&gt;</span> de cada
        publicación. Los leads no se muestran porque la landing externa aún no reenvía el código.
      </p>
    </div>
  );
}
