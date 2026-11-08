'use client';

import { useState } from 'react';
import { BuyWidget } from 'thirdweb/react';
import { base } from 'thirdweb/chains';
import { client } from '@saasfly/shared/thirdweb-client';
import { wallets } from '@/lib/wallets';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

/** USDC en Base: mismo token que se transfiere y que verifica el settle. */
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

type Phase = 'idle' | 'funded' | 'error';

/**
 * "Comprar USDC con tarjeta" — el flujo probado del Pay & Finance de admin.
 *
 * La rampa (thirdweb Pay) fondea la wallet DEL PAGADOR: el login social crea una
 * smart wallet al vuelo y la tarjeta compra USDC en Base. Después el pagador
 * transfiere ese USDC al cobrador con el botón de pago (misma red, mismo token).
 *
 * No se usa un checkout de comercio (receiver = vendedor) porque ahí la rampa
 * tiene que enrutar pago directo y falla según proveedor/país.
 */
export function BuyUsdcPanel({
  amount,
  onFunded,
}: {
  amount: string;
  onFunded?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [detail, setDetail] = useState<string | null>(null);

  if (phase === 'funded') {
    return (
      <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 p-5 text-center">
        <CheckCircle2 className="mx-auto h-7 w-7 text-lime-400" />
        <h3 className="mt-2 text-sm font-semibold text-lime-200">USDC acreditado en tu wallet</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-lime-200/70">
          Listo. Ahora completa el cobro con el botón de pago: el USDC se transfiere a la wallet del cobrador.
        </p>
        <button
          type="button"
          onClick={() => {
            setPhase('idle');
            setDetail(null);
            onFunded?.();
          }}
          className="mt-3 rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-1.5 text-[11px] font-semibold text-lime-300 hover:bg-lime-400/20"
        >
          Continuar al pago
        </button>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-rose-400" />
        <h3 className="mt-2 text-sm font-semibold text-rose-200">No se pudo comprar USDC con tarjeta</h3>
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
            Reintentar
          </button>
          <p className="text-[10px] leading-relaxed text-zinc-500">
            Si el proveedor no abre, permite las ventanas emergentes para este sitio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <BuyWidget
        client={client}
        chain={base}
        tokenAddress={USDC_BASE}
        amount={String(Number(amount))}
        paymentMethods={['card']}
        // Sin `country`: medido, enviarlo hace que varios proveedores respondan 400.
        currency="USD"
        // Login social (Google/email/Telegram/passkey) además de wallets externas:
        // la smart wallet se crea al vuelo, igual que en el modelo de admin.
        connectOptions={{ wallets }}
        theme="dark"
        showThirdwebBranding={false}
        onSuccess={() => setPhase('funded')}
        onError={(error) => {
          console.error('[Nexus BuyUsdc] widget error:', error.message, error);
          setPhase('error');
          setDetail(error.message);
        }}
        onCancel={() => {
          setPhase('idle');
          setDetail(null);
        }}
      />
      <p className="border-t border-zinc-800/60 px-3 py-2 text-center text-[9px] leading-relaxed text-zinc-500">
        Compra USDC en tu propia wallet (se crea con tu login social si no tienes una). Después pagas el cobro con
        ese saldo. Si la ventana del proveedor no abre, permite ventanas emergentes.
      </p>
    </div>
  );
}
