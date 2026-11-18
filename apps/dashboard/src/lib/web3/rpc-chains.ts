/**
 * Cadenas con RPC PROPIO para lecturas on-chain.
 *
 * Problema que resuelve: todos los `getContract({ chain: base })` de thirdweb
 * usaban el RPC de thirdweb. Con 15+ componentes leyendo en paralelo, una sola
 * visita a /projects/[slug]/dao disparaba ráfagas de 100 RPS y thirdweb
 * respondía 429 (y el SDK reintentaba, multiplicando el consumo).
 *
 * Regla: thirdweb se queda para wallet y checkout (su negocio);
 * las LECTURAS van por RPC propio.
 *
 * Prioridad de endpoint:
 *   1. ALCHEMY_API_KEY  (o NEXT_PUBLIC_ALCHEMY_API_KEY)
 *   2. BASE_RPC_URL / BASE_SEPOLIA_RPC_URL explícitos
 *   3. RPC público de Base (sin cuota de terceros)
 */

import { base, baseSepolia } from 'thirdweb/chains';

const ALCHEMY_KEY =
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? process.env.ALCHEMY_API_KEY ?? '';

function pick(...candidates: Array<string | undefined | null>): string {
  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) return candidate.trim();
  }
  return '';
}

export const BASE_MAINNET_RPC = pick(
  process.env.NEXT_PUBLIC_BASE_RPC_URL,
  process.env.BASE_RPC_URL,
  ALCHEMY_KEY ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}` : '',
  'https://mainnet.base.org',
);

export const BASE_SEPOLIA_RPC = pick(
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
  process.env.BASE_SEPOLIA_RPC_URL,
  process.env.SEPOLIA_RPC_URL,
  ALCHEMY_KEY ? `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}` : '',
  'https://sepolia.base.org',
);

/** Base mainnet (8453) con RPC propio. */
export const baseMainnet = { ...base, rpc: BASE_MAINNET_RPC };

/** Base Sepolia (84532) con RPC propio. */
export const baseSepoliaTestnet = { ...baseSepolia, rpc: BASE_SEPOLIA_RPC };

/** Devuelve la cadena con RPC propio para un chainId dado (soporta Base y Base Sepolia). */
export function chainWithOwnRpc(chainId: number) {
  if (chainId === 8453) return baseMainnet;
  if (chainId === 84532 || chainId === 11155111) {
    // 11155111 = Ethereum Sepolia; el proyecto usa Base Sepolia como testnet.
    return baseSepoliaTestnet;
  }
  return baseMainnet;
}

/** ¿Se está usando Alchemy o el RPC público? Útil para verificar en runtime. */
export function rpcProviderLabel(): 'alchemy' | 'public' {
  return BASE_MAINNET_RPC.includes('alchemy.com') ? 'alchemy' : 'public';
}
