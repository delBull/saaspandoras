import type { Metadata } from 'next';
import { createHash } from 'node:crypto';
import { sql } from '@saasfly/db-core';
import { db } from '@saasfly/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Demostración · Pandora\u2019s',
  description: 'Vista de demostración en solo lectura.',
  robots: { index: false, follow: false },
};

const STAGES: Array<{ key: string; label: string }> = [
  { key: 'nuevo', label: 'Nuevo' },
  { key: 'contactado', label: 'Contactado' },
  { key: 'calificado', label: 'Calificado' },
  { key: 'discovery_solicitado', label: 'Discovery' },
  { key: 'visita_realizada', label: 'Visita' },
  { key: 'propuesta', label: 'Propuesta' },
  { key: 'ganada', label: 'Ganada' },
  { key: 'perdida', label: 'Perdida' },
];

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function rows<T = Record<string, unknown>>(query: unknown): Promise<T[]> {
  const result = (await db.execute(query as never)) as { rows?: T[] } | T[];
  return Array.isArray(result) ? result : (result.rows ?? []);
}

type Link = { organization_id: string; label: string; expires_at: string; view_count: number };
type Opp = {
  id: string; title: string; stage_key: string; owner_collaborator_id: string;
  estimated_value_usd: string; closed_revenue_usd: string | null; source: string;
  next_action: string | null; last_contact_at: string | null; closed_at: string | null;
  close_reason: string | null;
};
type Act = { opportunity_id: string; type: string; content: string; occurred_at: string };
type Totals = { leads: number; valid_leads: number; spend: string | null };

export default async function DemoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const linkRows = await rows<Link>(sql`
    select organization_id, label, expires_at, view_count
    from demo_links
    where token_hash = ${sha256(token)}
      and revoked_at is null
      and expires_at > now()
    limit 1
  `);

  const link = linkRows[0];
  if (!link) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-white">Enlace no disponible</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Esta demostración expiró o fue revocada. Solicita un enlace nuevo.
        </p>
      </main>
    );
  }

  // Uso registrado (auditoría del enlace)
  await db.execute(sql`
    update demo_links set view_count = view_count + 1, last_viewed_at = now()
    where organization_id = ${link.organization_id}
      and token_hash = ${sha256(token)}
  `);

  const orgId = link.organization_id;
  const opportunities = await rows<Opp>(sql`
    select id, title, stage_key, owner_collaborator_id, estimated_value_usd,
           closed_revenue_usd, source, next_action, last_contact_at, closed_at, close_reason
    from crm_opportunities where organization_id = ${orgId} order by created_at asc
  `);
  const activities = await rows<Act>(sql`
    select opportunity_id, type, content, occurred_at
    from crm_activities where organization_id = ${orgId} order by occurred_at desc limit 60
  `);
  const totalsRows = await rows<Totals>(sql`
    select
      (select count(*)::int from marketing_leads where project_id = (select id from projects where organization_id::text = ${orgId} limit 1)) as leads,
      (select count(*)::int from marketing_leads where consent = true and project_id = (select id from projects where organization_id::text = ${orgId} limit 1)) as valid_leads,
      (select sum(amount_usd)::text from ad_spend_entries where organization_id = ${orgId}) as spend
  `);
  const totals = totalsRows[0] ?? { leads: 0, valid_leads: 0, spend: null };

  const closed = opportunities
    .filter((o) => o.stage_key === 'ganada')
    .reduce((sum, o) => sum + Number(o.closed_revenue_usd ?? 0), 0);
  const estimated = opportunities.reduce((sum, o) => sum + Number(o.estimated_value_usd ?? 0), 0);
  const spend = totals.spend ? Number(totals.spend) : null;
  const cpl = spend !== null && totals.valid_leads > 0 ? spend / totals.valid_leads : null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
        Demostración en solo lectura · datos de ejemplo · {link.label} · caduca{' '}
        {String(link.expires_at).slice(0, 10)}
      </div>

      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-purple-400">Pandora&apos;s · Demo</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Operación de captación</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Así se ve el sistema trabajando: cada prospecto con origen, etapa, responsable y
          próxima acción. El ingreso cerrado se cuenta aparte de la estimación.
        </p>
      </header>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Leads captados', value: totals.leads },
          { label: 'Leads válidos', value: totals.valid_leads },
          { label: 'Oportunidades', value: opportunities.length },
          { label: 'Ingreso cerrado', value: `USD ${closed.toLocaleString('en-US')}` },
          { label: 'CPL', value: cpl === null ? 'no calculable' : `USD ${cpl.toFixed(0)}` },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">{card.label}</p>
            <p className="mt-1 text-xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Pipeline · valor estimado USD {estimated.toLocaleString('en-US')}
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-3">
          {STAGES.map((stage) => {
            const items = opportunities.filter((o) => o.stage_key === stage.key);
            const sum = items.reduce((acc, o) => acc + Number(o.estimated_value_usd ?? 0), 0);
            return (
              <div key={stage.key} className="min-w-[200px] flex-1 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    {stage.label}
                  </p>
                  <span className="text-[11px] text-zinc-500">{items.length}</span>
                </div>
                <p className="mb-2 text-[11px] text-zinc-500">USD {sum.toLocaleString('en-US')}</p>
                <div className="space-y-2">
                  {items.map((opportunity) => (
                    <div key={opportunity.id} className="rounded-lg border border-white/10 bg-black/40 p-2">
                      <p className="text-xs font-medium text-white">{opportunity.title}</p>
                      <p className="mt-1 text-[10px] text-zinc-500">
                        {opportunity.owner_collaborator_id} · {opportunity.source}
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-400">
                        USD {Number(opportunity.estimated_value_usd).toLocaleString('en-US')}
                        {opportunity.closed_revenue_usd
                          ? ` · cerrado USD ${Number(opportunity.closed_revenue_usd).toLocaleString('en-US')}`
                          : ''}
                      </p>
                      {opportunity.next_action && (
                        <p className="mt-1 text-[10px] text-purple-300">→ {opportunity.next_action}</p>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && <p className="py-2 text-center text-[10px] text-zinc-600">—</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Historial de actividad (últimos registros)
        </h2>
        <ul className="space-y-1.5">
          {activities.slice(0, 12).map((activity, index) => (
            <li key={`${activity.opportunity_id}-${index}`} className="text-xs text-zinc-400">
              <span className="text-zinc-500">
                {String(activity.occurred_at).slice(0, 10)} · {activity.type}
              </span>{' '}
              — {activity.content}
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-8 border-t border-white/10 pt-4 text-[11px] text-zinc-500">
        Datos de demostración. Ninguna acción de este enlace modifica información. · Pandora&apos;s
      </footer>
    </main>
  );
}
