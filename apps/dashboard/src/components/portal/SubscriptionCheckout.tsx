'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCheckout } from '@/components/payments/CreditCheckout';

/**
 * Pago del PLAN mensual (acceso a los productos). Separado de los créditos.
 * Reutiliza el mismo checkout (thirdweb → USDC a treasury); el servidor
 * verifica on-chain y extiende 30 días.
 */
export function SubscriptionCheckout({
  tenantId,
  amountUsd,
  treasury,
}: {
  tenantId: string;
  amountUsd: number;
  treasury: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  if (!amountUsd || amountUsd <= 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-zinc-400">
        Tu plan no tiene importe configurado. Contacta a soporte para fijar el precio de tus productos.
      </p>
    );
  }

  if (!treasury) {
    return (
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
        El servidor no tiene wallet de tesorería configurada; el pago del plan está deshabilitado.
      </p>
    );
  }

  const submit = async (txHash: string) => {
    setProcessing(true);
    setStatus(null);
    try {
      const res = await fetch('/api/v1/hermes/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, txHash, chainId: 8453 }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus({
          ok: true,
          message: data.alreadyPaid
            ? 'Ese pago ya estaba registrado. Tu plan sigue activo.'
            : `Plan pagado. Activo hasta ${new Date(data.plan.currentPeriodEnd).toLocaleDateString('es')}.`,
        });
        router.refresh();
      } else {
        setStatus({ ok: false, message: data.error ?? 'No se pudo registrar el pago del plan.' });
      }
    } catch (error: unknown) {
      setStatus({ ok: false, message: error instanceof Error ? error.message : 'Error de conexión.' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      <CreditCheckout
        amountUsd={amountUsd}
        treasury={treasury}
        title="Pandora's — Plan mensual"
        description={`Plan mensual (${amountUsd.toFixed(2)} USD): acceso a tus productos instalados`}
        onTransaction={(hash) => void submit(hash)}
        onError={(message) => setStatus({ ok: false, message })}
      />
      {processing && <p className="text-xs text-zinc-400">Verificando el pago on-chain…</p>}
      {status && (
        <p
          className={`rounded-xl border p-3 text-xs ${
            status.ok
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
          }`}
        >
          {status.message}
        </p>
      )}
      <p className="text-[10px] text-zinc-500">
        El pago del plan es independiente del saldo de créditos de media.
      </p>
    </div>
  );
}
