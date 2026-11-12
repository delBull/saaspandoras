import React from 'react';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { getOrCreateSubscription } from '@/lib/billing/subscription';
import { resolveTreasuryWallet } from '@/lib/payments/treasury';
import { SubscriptionCheckout } from '@/components/portal/SubscriptionCheckout';

export const dynamic = 'force-dynamic';

/**
 * /portal/[slug]/billing — Plan mensual del tenant.
 *
 * El fee es la SUMA de los paquetes de los productos instalados (starter/growth
 * del PRODUCT_REGISTRY). Es independiente del saldo de créditos de media.
 */
export default async function PortalBillingPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const ctx = await tryResolvePortalContext(organizationSlug);
  if (!ctx) notFound();

  const tenantId = ctx.organization.slug;
  const plan = await getOrCreateSubscription(tenantId);
  const treasury = resolveTreasuryWallet();

  const statusLabel =
    plan?.state.status === 'active'
      ? 'Activo'
      : plan?.state.status === 'grace'
        ? 'En gracia'
        : plan?.state.status === 'suspended'
          ? 'Suspendido (solo lectura)'
          : plan?.state.status ?? '—';

  const statusTone =
    plan?.state.status === 'active'
      ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
      : plan?.state.status === 'grace'
        ? 'text-amber-200 border-amber-500/30 bg-amber-500/10'
        : 'text-rose-200 border-rose-500/30 bg-rose-500/10';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Plan y facturación</h1>
        <p className="text-sm text-zinc-400">
          Acceso mensual a los productos instalados. Los créditos de media se compran aparte.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Plan mensual</p>
            <p className="text-2xl font-semibold text-white">${(plan?.amountUsd ?? 0).toFixed(2)} <span className="text-sm font-normal text-zinc-400">USD / mes</span></p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs ${statusTone}`}>{statusLabel}</span>
        </div>

        <div className="text-xs text-zinc-400">
          {plan?.state.status === 'active' && plan.currentPeriodEnd && (
            <>Próximo cargo: <strong className="text-zinc-200">{new Date(plan.currentPeriodEnd).toLocaleDateString('es')}</strong> ({plan.state.daysToCharge} día(s)).</>
          )}
          {plan?.state.status === 'grace' && plan.graceEndsAt && (
            <>Periodo de gracia: <strong className="text-amber-200">{plan.state.graceDaysLeft} día(s)</strong> antes de solo lectura (hasta {new Date(plan.graceEndsAt).toLocaleDateString('es')}).</>
          )}
          {plan?.state.status === 'suspended' && (
            <>Cuenta en <strong className="text-rose-200">solo lectura</strong>. Tus datos se conservan; paga el plan para reactivar.</>
          )}
        </div>

        {plan && plan.lines.length > 0 && (
          <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
            {plan.lines.map((line) => (
              <li key={`${line.product}-${line.tier}`} className="flex items-center justify-between px-4 py-2 text-xs">
                <span className="text-zinc-300">
                  {line.product} <span className="text-zinc-500">· {line.tier}</span>
                </span>
                <span className="font-mono text-zinc-200">${line.priceUsd.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
        <h2 className="text-sm font-medium text-white">Pagar el plan (30 días)</h2>
        <SubscriptionCheckout
          tenantId={tenantId}
          amountUsd={plan?.amountUsd ?? 0}
          treasury={treasury.ok ? treasury.wallet : null}
        />
      </section>
    </div>
  );
}
