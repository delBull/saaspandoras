/**
 * 🏦 Growth OS On-Chain Treasury Resolver
 * src/lib/growth/treasury-onchain.ts
 *
 * Resolves the REAL sovereign treasury of a tenant organization from on-chain
 * data and reads live balances (native + USDC) via thirdweb's getWalletBalance.
 *
 * Address resolution precedence (canonical authority):
 *   1. allowanceControllerAddress  → the deployed Safe Proxy (Smart Account)
 *   2. treasuryAddress             → configured sovereign treasury
 *   3. destinationWallet           → payout override wallet
 *   4. applicantWalletAddress      → founder wallet
 *
 * Fail-closed: if credentials or RPC are unavailable, balances resolve to 0
 * (never crashing the API boundary) while still returning the real treasury
 * address so the UI reflects the on-chain account.
 */

import { client } from '@/lib/thirdweb-client';
import { defineChain } from 'thirdweb';
import { getWalletBalance } from 'thirdweb/wallets';
import { getUsdcAddress } from '@/lib/treasury/usdc-contract';

const CHAIN_ID_MAINNET = 8453; // Base
const CHAIN_ID_SEPOLIA = 11155111;

export interface TreasuryOnchainResult {
  treasuryAddress: string;
  smartAccountAddress: string;
  balanceUsdc: number;
  balanceNative: number;
  nativeSymbol: string;
  usdcSymbol: string;
  chainId: number;
  source: 'onchain' | 'fallback';
}

type ProjectLike = {
  allowanceControllerAddress?: string | null;
  treasuryAddress?: string | null;
  destinationWallet?: string | null;
  applicantWalletAddress?: string | null;
  creatorWallet?: string | null;
  chainId?: number | null;
};

/**
 * Resolve the canonical treasury address for a project following the
 * safe → treasury → destination → founder precedence.
 */
export function resolveTreasuryAddress(project: ProjectLike): string {
  return (
    project.allowanceControllerAddress ||
    project.treasuryAddress ||
    project.destinationWallet ||
    project.creatorWallet ||
    project.applicantWalletAddress ||
    ''
  ).trim();
}

/**
 * Resolve chain id for a project, falling back to the deployed network context.
 */
export function resolveTreasuryChainId(project: ProjectLike): number {
  if (project.chainId) return project.chainId;
  return process.env.NODE_ENV === 'production' ? CHAIN_ID_MAINNET : CHAIN_ID_SEPOLIA;
}

/**
 * Read live on-chain treasury balances. Fail-closed: returns 0 balances when
 * the treasury address is unavailable or the RPC call throws, never throwing.
 */
export async function getTreasuryBalances(
  project: ProjectLike | undefined | null
): Promise<TreasuryOnchainResult | null> {
  if (!project) return null;

  const treasuryAddress = resolveTreasuryAddress(project);
  if (!treasuryAddress) return null;

  const chainId = resolveTreasuryChainId(project);
  const chain = defineChain(chainId);

  try {
    const usdcAddress = getUsdcAddress() as string | undefined;

    const [native, usdc] = await Promise.all([
      getWalletBalance({ client, chain, address: treasuryAddress }).catch(() => null),
      usdcAddress
        ? getWalletBalance({ client, chain, address: treasuryAddress, tokenAddress: usdcAddress }).catch(() => null)
        : Promise.resolve(null),
    ]);

    return {
      treasuryAddress,
      smartAccountAddress: treasuryAddress,
      balanceUsdc: usdc ? Number(usdc.displayValue) : 0,
      balanceNative: native ? Number(native.displayValue) : 0,
      nativeSymbol: native?.symbol || 'ETH',
      usdcSymbol: usdc?.symbol || 'USDC',
      chainId,
      source: 'onchain',
    };
  } catch (err: any) {
    console.error('[TreasuryOnchain] Balance fetch failed:', err?.message || err);
    return {
      treasuryAddress,
      smartAccountAddress: treasuryAddress,
      balanceUsdc: 0,
      balanceNative: 0,
      nativeSymbol: 'ETH',
      usdcSymbol: 'USDC',
      chainId,
      source: 'fallback',
    };
  }
}
