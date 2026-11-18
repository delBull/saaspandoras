'use client';

import React from 'react';
import { CheckoutWidget } from 'thirdweb/react';
import { base } from 'thirdweb/chains';
import { client } from '@saasfly/shared/thirdweb-client';

/**
 * Pago con tarjeta (y crypto) para recargar créditos de Hermes.
 *
 * Reutiliza la infraestructura que ya existe:
 *  - `client` de thirdweb (`@saasfly/shared/thirdweb-client`)
 *  - USDC en Base y la treasury de Pandora's (las mismas del depósito on-chain)
 *  - la verificación on-chain server-side (`POST /billing/deposit`): el cliente
 *    sólo aporta el `txHash`; el importe lo lee el servidor del recibo.
 *
 * No inventa liquidación: si el pago no llega a la treasury, no hay abono.
 */

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export interface CreditCheckoutProps {
  amountUsd: number;
  treasury: string;
  title?: string;
  /** Texto del checkout (por defecto, recarga de créditos de media). */
  description?: string;
  onTransaction: (txHash: string, paymentId?: string) => void;
  onError?: (message: string) => void;
}

export function CreditCheckout({
  amountUsd,
  treasury,
  title,
  description,
  onTransaction,
  onError,
}: CreditCheckoutProps) {
  if (!treasury || !/^0x[a-fA-F0-9]{40}$/.test(treasury)) {
    return (
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
        El servidor no reportó una wallet de tesorería válida. La recarga con tarjeta está deshabilitada
        hasta que se configure (no se inventa un destino).
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-2">
      <CheckoutWidget
        client={client}
        chain={base}
        tokenAddress={USDC_BASE}
        amount={amountUsd.toFixed(2)}
        seller={treasury as `0x${string}`}
        name={title ?? "Pandora's — Créditos Hermes"}
        description={description ?? `Recarga de $${amountUsd.toFixed(2)} USD en créditos de cómputo`}
        paymentMethods={['card', 'crypto']}
        onSuccess={(data) => {
          // El widget devuelve las transacciones ejecutadas; nos interesa la de
          // destino (Base) porque es la que el servidor puede verificar.
          const onBase = data.statuses
            .flatMap((status: any) => status.transactions ?? [])
            .find((tx: any) => Number(tx.chainId) === 8453);

          const paymentId = (data.statuses?.[0] as any)?.paymentId as string | undefined;

          if (!onBase?.transactionHash) {
            onError?.(
              'El pago se completó pero no recibimos el hash de la transacción en Base. Escríbenos con tu comprobante; no vuelvas a pagar.'
            );
            return;
          }

          onTransaction(onBase.transactionHash, paymentId);
        }}
        onError={(error) => onError?.(error?.message ?? 'El pago falló.')}
      />
    </div>
  );
}
