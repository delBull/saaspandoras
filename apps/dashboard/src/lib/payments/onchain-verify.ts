import { createPublicClient, decodeEventLog, erc20Abi, formatUnits, http, type Chain, type Hash } from 'viem';
import { base, baseSepolia } from 'viem/chains';

/**
 * Verificación on-chain de un pago USDC a la treasury.
 *
 * Compartida por:
 *   - depósitos de créditos de media (`/api/v1/hermes/billing/deposit`)
 *   - pago del plan mensual (`/api/v1/hermes/billing/subscription`)
 *
 * Reglas (fail-closed):
 *   - Sólo Base mainnet en producción.
 *   - El importe se lee del log `Transfer` (nunca del cliente).
 *   - Varias transferencias a la treasury en la misma tx ⇒ AMBIGUOUS (se revisa a mano).
 */

export const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const USDC_SEPOLIA = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

export const SUPPORTED_CHAINS: Record<number, { chain: Chain; usdc: `0x${string}` }> = {
  8453: { chain: base, usdc: USDC_BASE },
  11155111: { chain: baseSepolia, usdc: USDC_SEPOLIA },
};

export function isTxHash(value: unknown): value is Hash {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{64}$/.test(value);
}

export type OnChainVerification =
  | { ok: true; blockNumber: string; from: string | null; amountUsd: number }
  | { ok: false; reason: string };

export async function verifyOnChainUsdcTransfer(params: {
  txHash: Hash;
  chainId: number;
  treasury: string;
  /** Etiqueta para logs (deposit | subscription). */
  context?: string;
}): Promise<OnChainVerification> {
  const cfg = SUPPORTED_CHAINS[params.chainId];
  if (!cfg) return { ok: false, reason: `Unsupported chainId: ${params.chainId}` };

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && params.chainId !== 8453) {
    return { ok: false, reason: 'En producción sólo se acepta Base mainnet (8453).' };
  }

  try {
    const publicClient = createPublicClient({ chain: cfg.chain, transport: http() });
    const receipt = await publicClient.getTransactionReceipt({ hash: params.txHash });
    if (!receipt) return { ok: false, reason: 'TRANSACTION_NOT_FOUND' };
    if (receipt.status === 'reverted') return { ok: false, reason: 'TRANSACTION_REVERTED' };

    const matches: Array<{ from: string; value: bigint }> = [];

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== cfg.usdc.toLowerCase()) continue;
      try {
        const decoded = decodeEventLog({ abi: erc20Abi, data: log.data, topics: log.topics });
        if (decoded.eventName !== 'Transfer') continue;
        const args = decoded.args as unknown as { from: string; to: string; value: bigint };
        if (args.to.toLowerCase() !== params.treasury.toLowerCase()) continue;
        matches.push({ from: args.from.toLowerCase(), value: args.value });
      } catch {
        // log no ERC-20: se ignora
      }
    }

    if (matches.length === 0) return { ok: false, reason: 'NO_MATCHING_TRANSFER_TO_TREASURY' };
    if (matches.length > 1) return { ok: false, reason: 'AMBIGUOUS_MULTIPLE_TRANSFERS_TO_TREASURY' };

    const [only] = matches;
    const amountUsd = Number(formatUnits(only!.value, 6));
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return { ok: false, reason: 'INVALID_TRANSFER_AMOUNT' };
    }

    return { ok: true, blockNumber: receipt.blockNumber.toString(), from: only!.from, amountUsd };
  } catch (error: unknown) {
    console.error(`[OnChainVerify${params.context ? `:${params.context}` : ''}] failed:`, error);
    return { ok: false, reason: 'VERIFICATION_ERROR' };
  }
}
