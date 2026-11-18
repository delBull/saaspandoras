import React from 'react';
import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db';
import { hermesComputeUsageEvents, hermesCreditDeposits } from '@saasfly/db/schema';
import { and, desc, eq, sql } from '@saasfly/db-core';
import { AdminAccessGate } from '../../AdminAccessGate';

export const dynamic = 'force-dynamic';

/**
 * /admin/finance/revenue
 *
 * Contabilidad interna: margen de plataforma (markup) por tenant y depósitos
 * recientes. El markup no se transfiere a otra wallet: se retiene del saldo
 * prepagado; aquí se cuantifica. El efectivo entra a la wallet de tesorería.
 */
export default async function PlatformRevenuePage() {
  const headers = await import('next/headers').then((m) => m.headers());
  const auth = await getNexusAuthContext(await headers);

  if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
    return (
      <AdminAccessGate
        reason={
          auth.isAuthenticated
            ? `Tu cuenta con rol '${auth.role}' no tiene acceso a contabilidad interna.`
            : 'Se requiere sesión de administrador de plataforma.'
        }
      />
    );
  }

  const revenueRows = await db
    .select({
      tenantId: hermesComputeUsageEvents.tenantId,
      events: sql<number>`count(*)`,
      computeCostUsd: sql<string>`coalesce(sum(${hermesComputeUsageEvents.rawCostUsd}), 0)`,
      markupUsd: sql<string>`coalesce(sum(${hermesComputeUsageEvents.markupCostUsd}), 0)`,
      billedUsd: sql<string>`coalesce(sum(${hermesComputeUsageEvents.totalChargedUsd}), 0)`,
    })
    .from(hermesComputeUsageEvents)
    .where(and(eq(hermesComputeUsageEvents.isSandbox, false), eq(hermesComputeUsageEvents.status, 'SETTLED')))
    .groupBy(hermesComputeUsageEvents.tenantId)
    .orderBy(desc(sql`coalesce(sum(${hermesComputeUsageEvents.markupCostUsd}), 0)`))
    .limit(50);

  const deposits = await db
    .select({
      id: hermesCreditDeposits.id,
      tenantId: hermesCreditDeposits.tenantId,
      amountUsd: hermesCreditDeposits.amountUsd,
      isSandbox: hermesCreditDeposits.isSandbox,
      txHash: hermesCreditDeposits.txHash,
      chainId: hermesCreditDeposits.chainId,
      createdAt: hermesCreditDeposits.createdAt,
    })
    .from(hermesCreditDeposits)
    .orderBy(desc(hermesCreditDeposits.createdAt))
    .limit(25);

  const totals = revenueRows.reduce(
    (acc, row) => {
      acc.compute += Number(row.computeCostUsd);
      acc.markup += Number(row.markupUsd);
      acc.billed += Number(row.billedUsd);
      return acc;
    },
    { compute: 0, markup: 0, billed: 0 }
  );

  const fmt = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Contabilidad interna · Ingresos</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Margen de plataforma (markup) por tenant y depósitos recientes. Uso interno: el markup nunca se comparte con
          el tenant.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Costo de cómputo</p>
          <p className="mt-1 font-mono text-lg text-zinc-200">${fmt(totals.compute)}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-[10px] uppercase tracking-wider text-emerald-300/70">Margen (markup)</p>
          <p className="mt-1 font-mono text-lg text-emerald-300">${fmt(totals.markup)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Facturado a tenants</p>
          <p className="mt-1 font-mono text-lg text-zinc-200">${fmt(totals.billed)}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200">Margen por tenant (eventos liquidados, sin sandbox)</h3>
        {revenueRows.length === 0 ? (
          <p className="text-xs text-zinc-500">Todavía no hay eventos liquidados.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-white/[0.03] text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Tenant</th>
                  <th className="px-3 py-2 font-medium">Eventos</th>
                  <th className="px-3 py-2 font-medium">Costo</th>
                  <th className="px-3 py-2 font-medium">Markup</th>
                  <th className="px-3 py-2 font-medium">Facturado</th>
                </tr>
              </thead>
              <tbody>
                {revenueRows.map((row) => (
                  <tr key={row.tenantId} className="border-t border-white/5">
                    <td className="px-3 py-2 font-mono text-zinc-200">{row.tenantId}</td>
                    <td className="px-3 py-2 text-zinc-400">{row.events}</td>
                    <td className="px-3 py-2 font-mono text-zinc-300">${fmt(Number(row.computeCostUsd))}</td>
                    <td className="px-3 py-2 font-mono text-emerald-300">${fmt(Number(row.markupUsd))}</td>
                    <td className="px-3 py-2 font-mono text-zinc-300">${fmt(Number(row.billedUsd))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200">Depósitos recientes</h3>
        {deposits.length === 0 ? (
          <p className="text-xs text-zinc-500">Sin depósitos registrados.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-white/[0.03] text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Tenant</th>
                  <th className="px-3 py-2 font-medium">Monto</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Red</th>
                  <th className="px-3 py-2 font-medium">Tx</th>
                  <th className="px-3 py-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => (
                  <tr key={deposit.id} className="border-t border-white/5">
                    <td className="px-3 py-2 font-mono text-zinc-200">{deposit.tenantId}</td>
                    <td className="px-3 py-2 font-mono text-zinc-300">${fmt(Number(deposit.amountUsd))}</td>
                    <td className="px-3 py-2 text-zinc-400">{deposit.isSandbox ? 'sandbox' : 'real'}</td>
                    <td className="px-3 py-2 text-zinc-400">{deposit.chainId ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-zinc-500">
                      {deposit.txHash.startsWith('sandbox_') ? 'sandbox' : `${deposit.txHash.slice(0, 10)}…`}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {new Date(deposit.createdAt).toLocaleString('es-MX')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
