'use client';

import { memo, useState } from 'react';
import { CheckoutWidget } from 'thirdweb/react';
import { base } from 'thirdweb/chains';
import { client } from '@saasfly/shared/thirdweb-client';
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

/** USDC en Base (mismo token que verifica el endpoint de settle). */
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

type Phase = 'idle' | 'processing' | 'paid' | 'pending' | 'error';

export interface CardCheckoutLink {
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

/**
 * Checkout con tarjeta (thirdweb CheckoutWidget) para un link de cobro.
 *
 * `country` es OBLIGATORIO en la práctica: el widget usa el país del pagador para
 * resolver qué proveedor de rampa aplica. Sin país, con `paymentMethods: ['card']`
 * el flujo salta directo a la selección de proveedor y se queda sin opciones
 * (el modal aparece y se cierra).
 */
function CardCheckoutPanelBase({
  link,
  country,
  onFallback,
}: {
  link: CardCheckoutLink;
  country: string;
  onFallback?: () => void;
}) {
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

  if (phase === 'paid') {
    return (
      <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 p-5 text-center">
        <CheckCircle2 className="mx-auto h-7 w-7 text-lime-400" />
        <h3 className="mt-2 text-sm font-semibold text-lime-200">Pago confirmado</h3>
        <p className="mt-1 text-[11px] text-lime-200/70">
          La transferencia fue verificada on-chain y el cobro quedó marcado como pagado.
        </p>
        {detail ? <p className="mt-2 break-all font-mono text-[10px] text-lime-200/50">{detail}</p> : null}
      </div>
    );
  }

  if (phase === 'pending') {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-amber-400" />
        <h3 className="mt-2 text-sm font-semibold text-amber-200">Pago recibido por el procesador</h3>
        <p className="mt-1 text-[11px] text-amber-200/70">
          Aún no se pudo verificar on-chain, así que el cobro <strong>no</strong> se marcó como pagado. El cobrador
          lo revisará y te confirmará.
        </p>
        {detail ? <p className="mt-2 break-all font-mono text-[10px] text-amber-200/50">{detail}</p> : null}
        <button
          type="button"
          onClick={() => {
            setPhase('idle');
            setDetail(null);
          }}
          className="mt-3 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-white/5"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-rose-400" />
        <h3 className="mt-2 text-sm font-semibold text-rose-200">No se pudo completar el pago con tarjeta</h3>
        <p className="mt-1 text-[11px] text-rose-200/70">No se realizó ningún cargo confirmado.</p>
        {detail ? <p className="mt-2 break-all font-mono text-[10px] text-rose-200/50">{detail}</p> : null}
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setPhase('idle');
              setDetail(null);
            }}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-white/5"
          >
            Reintentar con tarjeta
          </button>
          {onFallback ? (
            <button
              type="button"
              onClick={onFallback}
              className="rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-1.5 text-[11px] font-semibold text-lime-300 hover:bg-lime-400/20"
            >
              Pagar con USDC en su lugar
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (phase === 'processing') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-xs text-zinc-300">
        <Loader2 className="h-4 w-4 animate-spin" /> Verificando el pago…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <CheckoutWidget
        client={client}
        // El settle fuerza Base mainnet en producción: el widget usa la misma red.
        chain={base}
        tokenAddress={USDC_BASE}
        amount={String(Number(link.amount))}
        seller={link.destinationWallet as `0x${string}`}
        name={link.title}
        description={link.description ?? undefined}
        // Moneda fiat de la rampa. Medido contra bridge.thirdweb.com con este
        // Client ID + USDC en Base + país MX:
        //   USD → transak ✅, rampnow ✅ | coinbase ❌ (moneda), stripe ❌ (sin ruta)
        //   MXN → transak ✅, rampnow 💥500 | coinbase ❌ (moneda), stripe ❌
        // USD deja más proveedores disponibles. Los 400 de coinbase/stripe son
        // esperados: no soportan USDC en Base.
        currency="USD"
        country={country}
        paymentMethods={['card']}
        // El comprador paga las comisiones de la rampa: así el importe on-chain
        // coincide con el del link y la verificación del settle no falla por fees.
        feePayer="user"
        connectOptions={{ connectModal: { title: 'Conecta tu wallet', size: 'compact' } }}
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
          // Diagnóstico: este mensaje es el que hay que mirar en la consola del navegador.
          console.error('[Nexus CardCheckout] widget error:', error.message, error);
          setPhase('error');
          setDetail(error.message);
        }}
        onCancel={() => {
          setPhase('idle');
          setDetail(null);
        }}
      />
      <p className="border-t border-zinc-800/60 px-3 py-2 text-center text-[9px] leading-relaxed text-zinc-500">
        Al confirmar, se abre la página del proveedor para pagar con tarjeta. Si no se abre, permite las ventanas
        emergentes para este sitio y reintenta.
      </p>
    </div>
  );
}

/**
 * Memoizado a propósito: el checkout público re-renderiza cada segundo por las
 * tasas en vivo. Sin esto, el widget de thirdweb recibía props nuevas en cada
 * tick y reiniciaba su cotización (el "blink" que nunca terminaba de cargar).
 */
export const CardCheckoutPanel = memo(CardCheckoutPanelBase);
