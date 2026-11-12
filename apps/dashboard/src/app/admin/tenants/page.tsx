import React from 'react';
import Link from 'next/link';
import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db';
import { sql } from '@saasfly/db-core';
import { AdminAccessGate } from '../AdminAccessGate';

export const dynamic = 'force-dynamic';

/**
 * /admin/tenants — "¿quién está dentro?"
 *
 * Una fila por tenant con: productos instalados, saldo, trial restante, último
 * acceso al portal y consumo de hoy vs ayer.
 *
 * Fuentes:
 *   projects · installed_products · hermes_tenant_credits ·
 *   hermes_portal_activity (nueva) · hermes_compute_usage_events
 */
export default async function AdminTenantsPage() {
  const headers = await import('next/headers').then((m) => m.headers());
  const auth = await getNexusAuthContext(await headers);
  if (!auth.isAuthenticated || !['SUPER_ADMIN', 'ADMIN', 'ADMIN_OPERATIONS'].includes(String(auth.role))) {
    return (
      <AdminAccessGate
        reason={
          auth.isAuthenticated
            ? `Tu rol '${auth.role}' no tiene acceso a la vista de tenants.`
            : 'Se requiere sesión de administrador.'
        }
      />
    );
  }

  const rows = (await db.execute(sql`
    select
      p.id,
      p.slug,
      p.title,
      p.status,
      p.tenant_type,
      p.trial_ends_at,
      coalesce(c.credit_balance_usd, 0) as balance_usd,
      a.last_seen_at,
      coalesce(u.today_usd, 0) as today_usd,
      coalesce(u.yesterday_usd, 0) as yesterday_usd,
      coalesce((
        select string_agg(ip.product || ' · ' || ip.plan || ' · ' || ip.status, ' | ')
        from installed_products ip where ip.project_id = p.id
      ), '—') as products,
      coalesce((
        select count(*) from hermes_credit_deposits d
        where d.tenant_id = p.slug and d.status = 'pending'
      ), 0) as pending_deposits
    from projects p
    left join hermes_tenant_credits c on c.tenant_id = p.slug
    left join hermes_portal_activity a on a.tenant_id = lower(p.slug)
    left join (
      select tenant_id,
        sum(case when created_at >= date_trunc('day', now()) then total_charged_usd else 0 end) as today_usd,
        sum(case when created_at >= date_trunc('day', now()) - interval '1 day'
                  and created_at < date_trunc('day', now()) then total_charged_usd else 0 end) as yesterday_usd
      from hermes_compute_usage_events
      where capability <> 'billing.credit.deposit'
      group by tenant_id
    ) u on u.tenant_id = p.slug
    order by a.last_seen_at desc nulls last, p.id desc
    limit 200
  `)) as any[];

  const now = Date.now();
  const fmtUsd = (v: unknown) => `$${Number(v ?? 0).toFixed(2)}`;
  const fmtDate = (v: unknown) => (v ? new Date(String(v)).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' }) : '—');
  const trialLeft = (v: unknown) => {
    if (!v) return '—';
    const days = Math.ceil((new Date(String(v)).getTime() - now) / 86_400_000);
    return days <= 0 ? 'vencido' : `${days} d`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Tenants</h1>
        <p className="text-sm text-zinc-400">
          Quién está dentro, qué tiene instalado, cuánto ha consumido y cuánto le queda de periodo.
        </p>
      </header>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/[0.03] text-zinc-400">
            <tr>
              <th className="px-4 py-2 font-medium">Tenant</th>
              <th className="px-4 py-2 font-medium">Productos</th>
              <th className="px-4 py-2 font-medium">Saldo</th>
              <th className="px-4 py-2 font-medium">Periodo</th>
              <th className="px-4 py-2 font-medium">Último acceso</th>
              <th className="px-4 py-2 font-medium">Hoy</th>
              <th className="px-4 py-2 font-medium">Ayer</th>
              <th className="px-4 py-2 font-medium">Pendientes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-300">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-zinc-500">
                  Sin datos.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2">
                  <Link href={`/portal/${r.slug}/overview`} className="text-white hover:underline">
                    {r.slug}
                  </Link>
                  <div className="text-[11px] text-zinc-500">
                    #{r.id} · {r.status} · {r.tenant_type ?? '—'}
                  </div>
                </td>
                <td className="px-4 py-2 text-zinc-400">{r.products}</td>
                <td className="px-4 py-2 font-mono">{fmtUsd(r.balance_usd)}</td>
                <td className="px-4 py-2">{trialLeft(r.trial_ends_at)}</td>
                <td className="px-4 py-2">{fmtDate(r.last_seen_at)}</td>
                <td className="px-4 py-2 font-mono">{fmtUsd(r.today_usd)}</td>
                <td className="px-4 py-2 font-mono text-zinc-500">{fmtUsd(r.yesterday_usd)}</td>
                <td className="px-4 py-2">
                  {Number(r.pending_deposits) > 0 ? (
                    <Link href="/admin/finance/deposits" className="text-amber-300 hover:underline">
                      {r.pending_deposits} depósito(s)
                    </Link>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-zinc-500">
        «Último acceso» se actualiza desde el layout del portal con throttle de 5 min. «Hoy/Ayer» excluye
        eventos de fondeo (solo consumo de cómputo).
      </p>
    </div>
  );
}
