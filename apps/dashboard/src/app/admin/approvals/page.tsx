import React from 'react';
import Link from 'next/link';
import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db';
import {
  hermesCreditDeposits,
  nexusActionRequests,
  operationalIntents,
  projects,
} from '@saasfly/db/schema';
import { and, desc, eq } from '@saasfly/db-core';
import { AdminAccessGate } from '../AdminAccessGate';

export const dynamic = 'force-dynamic';

/**
 * /admin/approvals — bandeja ÚNICA de aprobaciones.
 *
 * Agrega lo que hoy estaba repartido en tres sitios, sin mover la autoridad de
 * cada flujo (cada acción se aprueba en su endpoint canónico):
 *   1. Depósitos de créditos pendientes     → /admin/finance/deposits
 *   2. Full-access (admin.full_access.v1)   → /admin/full-access-approvals
 *   3. Action requests de Nexus (PENDING)   → Nexus
 */
export default async function AdminApprovalsPage() {
  const headers = await import('next/headers').then((m) => m.headers());
  const auth = await getNexusAuthContext(await headers);
  if (!auth.isAuthenticated || !['SUPER_ADMIN', 'ADMIN', 'ADMIN_OPERATIONS'].includes(String(auth.role))) {
    return (
      <AdminAccessGate
        reason={
          auth.isAuthenticated
            ? `Tu rol '${auth.role}' no tiene acceso a la bandeja de aprobaciones.`
            : 'Se requiere sesión de administrador.'
        }
      />
    );
  }

  const [deposits, fullAccess, actions] = await Promise.all([
    db
      .select({
        id: hermesCreditDeposits.id,
        tenantId: hermesCreditDeposits.tenantId,
        amountUsd: hermesCreditDeposits.amountUsd,
        createdAt: hermesCreditDeposits.createdAt,
      })
      .from(hermesCreditDeposits)
      .where(eq(hermesCreditDeposits.status, 'pending'))
      .orderBy(desc(hermesCreditDeposits.createdAt))
      .limit(25),
    db
      .select({
        id: operationalIntents.id,
        organizationId: operationalIntents.organizationId,
        createdAt: operationalIntents.createdAt,
      })
      .from(operationalIntents)
      .where(
        and(
          eq(operationalIntents.intentType, 'admin.full_access.v1'),
          eq(operationalIntents.status, 'proposed')
        )
      )
      .orderBy(desc(operationalIntents.createdAt))
      .limit(25),
    db
      .select({
        id: nexusActionRequests.id,
        actionType: nexusActionRequests.actionType,
        canonicalOrgId: nexusActionRequests.canonicalOrgId,
        requiredCapability: nexusActionRequests.requiredCapability,
        createdAt: nexusActionRequests.createdAt,
      })
      .from(nexusActionRequests)
      .where(eq(nexusActionRequests.status, 'PENDING'))
      .orderBy(desc(nexusActionRequests.createdAt))
      .limit(25),
  ]);

  const total = deposits.length + fullAccess.length + actions.length;
  const fmtDate = (v: unknown) =>
    v ? new Date(String(v)).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Aprobaciones</h1>
        <p className="text-sm text-zinc-400">
          {total} pendiente(s). Cada flujo se autoriza en su endpoint canónico; aquí solo se centraliza la cola.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-medium text-white">Depósitos de créditos</h2>
          <Link href="/admin/finance/deposits" className="text-xs text-sky-300 hover:underline">
            Abrir bandeja →
          </Link>
        </div>
        {deposits.length === 0 ? (
          <p className="px-5 py-4 text-xs text-zinc-500">Sin depósitos pendientes.</p>
        ) : (
          <ul className="divide-y divide-white/5 text-xs">
            {deposits.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-2 text-zinc-300">
                <span className="font-semibold text-white">${Number(d.amountUsd).toFixed(2)}</span>
                <span>{d.tenantId}</span>
                <span className="ml-auto text-zinc-500">{fmtDate(d.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-medium text-white">Full access (SUPER_ADMIN)</h2>
          <Link href="/admin/full-access-approvals" className="text-xs text-sky-300 hover:underline">
            Abrir bandeja →
          </Link>
        </div>
        {fullAccess.length === 0 ? (
          <p className="px-5 py-4 text-xs text-zinc-500">Sin peticiones de full access.</p>
        ) : (
          <ul className="divide-y divide-white/5 text-xs">
            {fullAccess.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 px-5 py-2 text-zinc-300">
                <span className="font-mono text-[11px] text-zinc-400">{f.organizationId}</span>
                <span className="ml-auto text-zinc-500">{fmtDate(f.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-medium text-white">Action requests (Nexus)</h2>
          <Link href="/nexus" className="text-xs text-sky-300 hover:underline">
            Ir a Nexus →
          </Link>
        </div>
        {actions.length === 0 ? (
          <p className="px-5 py-4 text-xs text-zinc-500">Sin solicitudes pendientes.</p>
        ) : (
          <ul className="divide-y divide-white/5 text-xs">
            {actions.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-2 text-zinc-300">
                <span className="font-mono text-[11px]">{a.actionType}</span>
                <span className="text-zinc-500">{a.canonicalOrgId ?? '—'}</span>
                <span className="text-zinc-600">cap: {a.requiredCapability}</span>
                <span className="ml-auto text-zinc-500">{fmtDate(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-[11px] text-zinc-500">
        Las aprobaciones de depósitos acreditan saldo (idempotente). Las de full access cambian plan a
        enterprise. Las de Nexus ejecutan su acción gobernada.
      </p>
    </div>
  );
}
