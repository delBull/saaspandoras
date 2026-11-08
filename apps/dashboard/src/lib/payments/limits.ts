/**
 * Límites mínimos por método de cobro.
 *
 * Las rampas de tarjeta (thirdweb onramp: Transak/MoonPay/Coinbase/Stripe…) tienen
 * un mínimo por transacción; si el link queda por debajo, `/v1/onramp/prepare`
 * responde 400 para todos los proveedores y el checkout no avanza. En vez de dejar
 * que el pagador choque con ese 400, el mínimo se valida al crear el link y se
 * refleja en el checkout.
 *
 * Configurable por entorno para ajustarlo al mínimo real de tu rampa:
 *   NEXT_PUBLIC_CARD_MIN_AMOUNT_USD   (default 5)
 *   NEXT_PUBLIC_CRYPTO_MIN_AMOUNT_USD (default 1)
 *
 * Los umbrales están en USD. Para monedas distintas no se compara contra un tipo de
 * cambio inventado: se deja pasar y la rampa decide (y su error se muestra tal cual).
 */

const DEFAULT_CARD_MIN_USD = 5;
const DEFAULT_CRYPTO_MIN_USD = 1;

export type PaymentMethod = 'card' | 'crypto' | 'wire';

export interface PaymentLimits {
  cardMinUsd: number;
  cryptoMinUsd: number;
}

function parseAmount(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getPaymentLimits(env: NodeJS.ProcessEnv = process.env): PaymentLimits {
  return {
    cardMinUsd: parseAmount(env.NEXT_PUBLIC_CARD_MIN_AMOUNT_USD, DEFAULT_CARD_MIN_USD),
    cryptoMinUsd: parseAmount(env.NEXT_PUBLIC_CRYPTO_MIN_AMOUNT_USD, DEFAULT_CRYPTO_MIN_USD),
  };
}

export interface MethodBlock {
  method: PaymentMethod;
  reason: string;
}

/**
 * Métodos realmente utilizables para un monto/moneda dados.
 * Sólo aplica mínimos cuando la moneda es USD (es la única con umbral conocido).
 */
export function usableMethods(
  methods: PaymentMethod[],
  amount: number,
  currency: string,
  env: NodeJS.ProcessEnv = process.env
): { usable: PaymentMethod[]; blocked: MethodBlock[] } {
  const limits = getPaymentLimits(env);
  const isUsd = (currency || 'USD').toUpperCase() === 'USD';
  const usable: PaymentMethod[] = [];
  const blocked: MethodBlock[] = [];

  for (const method of methods) {
    if (isUsd && Number.isFinite(amount)) {
      if (method === 'card' && amount < limits.cardMinUsd) {
        blocked.push({ method, reason: `El mínimo con tarjeta es ${limits.cardMinUsd} USD.` });
        continue;
      }
      if (method === 'crypto' && amount < limits.cryptoMinUsd) {
        blocked.push({ method, reason: `El mínimo en cripto es ${limits.cryptoMinUsd} USD.` });
        continue;
      }
    }
    usable.push(method);
  }

  return { usable, blocked };
}
