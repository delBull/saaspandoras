'use client';

import { useState } from 'react';
import { CheckoutWidget } from 'thirdweb/react';
import { base } from 'thirdweb/chains';
import { client } from '@saasfly/shared/thirdweb-client';
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

/** USDC en Base (mismo token que verifica el endpoint de settle). */
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

type Phase = 'idle' | 'processing' | 'paid' | 'pending' | 'error';

interface CardLink {
  id: string;
  title: string;
  description: string | null;
  amount: string;
  currency: string;
  destinationWallet: string;
  networkChainId: number;
}

interface SettleResponse {
  ok?: boolean;
  error?: string;
  reason?: string;
  message?: string;
}

export function CardCheckoutClient({ link }: { link: CardLink }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [detail, setDetail] = useState<string | null>(null);

  const settle = async (txHash: string): Promise<{ ok: boolean; reason?: string }> => {
    const res = await fetch('/api/v1/payments/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // El monto NO se envía: el servidor usa el del link (anti-arbitraje).
      body: JSON.stringify({ linkId: link.id, txHash }),
    });
    const data = (await res.json().catch(() => null)) as SettleResponse | null;
    if (res.ok) return { ok: true };
    return { ok: false, reason: data?.reason ?? data?.error ?? `HTTP ${res.status}` };
  };

  return (
    <div className="w-full max-w-md">
      {phase === 'paid' && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
          <h2 className="mt-3 text-sm font-semibold text-emerald-200">Pago confirmado</h2>
          <p className="mt-1 text-[11px] text-emerald-200/70">
            La transferencia fue verificada on-chain y el cobro quedó marcado como pagado.
          </p>
          {detail ? <p className="mt-2 break-all font-mono text-[10px] text-emerald-200/50">{detail}</p> : null}
        </div>
      )}

      {phase === 'pending' && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
          <h2 className="mt-3 text-sm font-semibold text-amber-200">Pago recibido por el procesador</h2>
          <p className="mt-1 text-[11px] text-amber-200/70">
            Todavía no se pudo verificar on-chain, así que el cobro <strong>no</strong> se marcó como pagado. El
            cobrador lo revisará y te confirmará.
          </p>
          {detail ? <p className="mt-2 break-all font-mono text-[10px] text-amber-200/50">{detail}</p> : null}
        </div>
      )}

      {phase === 'error' && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-400" />
          <h2 className="mt-3 text-sm font-semibold text-rose-200">No se pudo completar el pago</h2>
          <p className="mt-1 text-[11px] text-rose-200/70">No se realizó ningún cargo confirmado.</p>
          {detail ? <p className="mt-2 break-all font-mono text-[10px] text-rose-200/50">{detail}</p> : null}
        </div>
      )}

      {phase === 'processing' && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-xs text-zinc-300">
          <Loader2 className="h-4 w-4 animate-spin" /> Verificando el pago…
        </div>
      )}

      {(phase === 'idle' || phase === 'processing') && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
          <CheckoutWidget
            client={client}
            // El settle fuerza Base mainnet en producción: el widget usa la misma red.
            chain={base}
            tokenAddress={USDC_BASE}
            amount={String(Number(link.amount))}
            seller={link.destinationWallet as `0x${string}`}
            name={link.title}
            description={link.description ?? undefined}
            currency="USD"
            paymentMethods={['card']}
            // El comprador paga las comisiones de la rampa: así el importe que
            // liquida on-chain coincide con el del link y la verificación del
            // settle (value >= amount) no falla por fees descontados al vendedor.
            feePayer="user"
            theme="dark"
            showThirdwebBranding={false}
            onSuccess={async (data) => {
              setPhase('processing');
              const transactions = data.statuses.flatMap((status) => status.transactions ?? []);
              if (transactions.length === 0) {
                setPhase('pending');
                setDetail('El procesador no devolvió una transacción on-chain para verificar.');
                return;
              }

              // Primero la red del link; el resto como respaldo.
              const ordered = [
                ...transactions.filter((tx) => tx.chainId === link.networkChainId),
                ...transactions.filter((tx) => tx.chainId !== link.networkChainId),
              ];

              const failures: string[] = [];
              for (const tx of ordered) {
                try {
                  const result = await settle(tx.transactionHash);
                  if (result.ok) {
                    setPhase('paid');
                    setDetail(tx.transactionHash);
                    return;
                  }
                  failures.push(`${tx.transactionHash}: ${result.reason ?? 'verificación fallida'}`);
                } catch (error: unknown) {
                  failures.push(
                    `${tx.transactionHash}: ${error instanceof Error ? error.message : 'error de red'}`
                  );
                }
              }

              setPhase('pending');
              setDetail(failures.join(' · ') || 'Sin transacciones verificables.');
            }}
            onError={(error) => {
              setPhase('error');
              setDetail(error.message);
            }}
            onCancel={() => {
              // Cancelar no es un error: se permite reintentar.
              setPhase('idle');
              setDetail(null);
            }}
          />
        </div>
      )}

      {(phase === 'paid' || phase === 'pending' || phase === 'error') && (
        <button
          type="button"
          onClick={() => {
            setPhase('idle');
            setDetail(null);
          }}
          className="mt-3 w-full rounded-xl border border-white/10 px-3 py-2 text-[11px] text-zinc-300 hover:bg-white/5"
        >
          {phase === 'paid' ? 'Cerrar' : 'Reintentar'}
        </button>
      )}
    </div>
  );
}
