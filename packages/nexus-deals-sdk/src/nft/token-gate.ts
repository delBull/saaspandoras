/**
 * 🔗 Token Gate — On-chain NFT Ownership Verification
 * lib/growth/nft/token-gate.ts
 *
 * Verifies that a wallet address holds at least one token from a deployed
 * NFT contract using a direct RPC call (balanceOf).
 *
 * Uses the same RPC provider strategy as the deployer (no new RPC stack).
 * Falls back to DB issuance records when on-chain check fails — and labels
 * the source transparently so callers know the verification method.
 *
 * Authority model:
 *   - contractAddress must come from tenant_nft_collections.contractAddress
 *     (DB — server-resolved) — never from client input
 *   - wallet address is normalized to lowercase
 *   - Never returns false on RPC failure — returns UNAVAILABLE instead
 *
 * Used by:
 *   - Hermes tool: nft_verify_access (Level 0 — read-only, no governance)
 *   - Future: portal access gate, webhook trigger verification
 */

import { StaticJsonRpcProvider } from '@ethersproject/providers';

export type TokenGateResult =
  | { holds: true;  balance: number; source: 'ONCHAIN' | 'DB_RECORD' }
  | { holds: false; balance: 0;      source: 'ONCHAIN' | 'DB_RECORD'; reason?: string }
  | { holds: null;  balance: null;   source: 'UNAVAILABLE'; reason: string };


// Minimal ERC-721/ERC-1155 balanceOf ABI
const ERC721_BALANCE_OF_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
];

const ERC1155_BALANCE_OF_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
];

// ── RPC endpoints by chain ────────────────────────────────────────────────────

const RPC_BY_CHAIN: Record<number, string[]> = {
  8453: [                    // Base Mainnet
    process.env.BASE_RPC_URL || '',
    'https://mainnet.base.org',
    'https://base.llamarpc.com',
    'https://base.drpc.org',
  ].filter(Boolean),
  84532: [                   // Base Sepolia
    process.env.BASE_SEPOLIA_RPC_URL || '',
    'https://sepolia.base.org',
    'https://base-sepolia.drpc.org',
  ].filter(Boolean),
  11155111: [                // Ethereum Sepolia
    process.env.SEPOLIA_RPC_URL || '',
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://sepolia.drpc.org',
  ].filter(Boolean),
};

async function getProvider(chainId: number): Promise<StaticJsonRpcProvider | null> {
  const rpcs = RPC_BY_CHAIN[chainId] || [];
  for (const url of rpcs) {
    if (!url) continue;
    try {
      const provider = new StaticJsonRpcProvider(url, { name: `chain-${chainId}`, chainId });
      // Quick health check with timeout
      await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), 3000)),
      ]);
      return provider;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Verify on-chain if `walletAddress` holds at least one token from the
 * NFT contract at `contractAddress` on `chainId`.
 *
 * @param contractAddress - From tenant_nft_collections.contractAddress (DB — never from client)
 * @param walletAddress   - Wallet to check
 * @param chainId         - From tenant_nft_collections.chainId (DB — never from client)
 * @param standard        - 'ERC-721' | 'ERC-1155' | 'SBT' (SBT uses ERC-721 ABI)
 * @param tokenId         - Required for ERC-1155 only
 */
export async function verifyOnchainOwnership(
  contractAddress: string,
  walletAddress: string,
  chainId: number,
  standard: string = 'ERC-721',
  tokenId: string = '1',
): Promise<TokenGateResult> {
  const normalizedWallet = walletAddress.toLowerCase();

  try {
    const provider = await getProvider(chainId);
    if (!provider) {
      return {
        holds: null,
        balance: null,
        source: 'UNAVAILABLE',
        reason: `No working RPC provider for chain ${chainId}.`,
      };
    }

    const { ethers } = await import('ethers');

    if (standard === 'ERC-1155') {
      const contract = new ethers.Contract(contractAddress, ERC1155_BALANCE_OF_ABI, provider);
      const balance: bigint = await Promise.race([
        contract.balanceOf(normalizedWallet, tokenId),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Contract call timeout')), 5000)),
      ]);
      const balanceNum = Number(balance);
      return {
        holds: balanceNum > 0,
        balance: balanceNum > 0 ? balanceNum : 0,
        source: 'ONCHAIN',
      } as TokenGateResult;
    }

    // ERC-721 and SBT (SBT uses ERC-721 balanceOf interface)
    const contract = new ethers.Contract(contractAddress, ERC721_BALANCE_OF_ABI, provider);
    const balance: bigint = await Promise.race([
      contract.balanceOf(normalizedWallet),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Contract call timeout')), 5000)),
    ]);
    const balanceNum = Number(balance);
    return {
      holds: balanceNum > 0,
      balance: balanceNum > 0 ? balanceNum : 0,
      source: 'ONCHAIN',
    } as TokenGateResult;

  } catch (err: any) {
    return {
      holds: null,
      balance: null,
      source: 'UNAVAILABLE',
      reason: err?.message || 'On-chain verification failed.',
    };
  }
}

/**
 * DB fallback: check if a wallet has a minted (non-revoked, non-expired) issuance
 * in a specific collection. Used when on-chain verification is unavailable.
 *
 * Source is labeled 'DB_RECORD' so callers can communicate the verification
 * method transparently.
 */
export async function verifyDbIssuance(
  collectionId: string,
  walletAddress: string,
): Promise<TokenGateResult> {
  try {
    const { db } = await import("@saasfly/db-core");
    const { tenantNftIssuances } = await import("@saasfly/db-core");
    const { and, eq } = await import("@saasfly/db-core");

    const now = new Date();
    const rows = await db
      .select({ id: tenantNftIssuances.id, expiresAt: tenantNftIssuances.expiresAt })
      .from(tenantNftIssuances)
      .where(and(
        eq(tenantNftIssuances.collectionId, collectionId),
        eq(tenantNftIssuances.recipientWallet, walletAddress.toLowerCase()),
        eq(tenantNftIssuances.status, 'minted'),
      ))
      .limit(5);

    // Filter out expired tokens
    const validTokens = rows.filter(r =>
      !r.expiresAt || new Date(r.expiresAt) > now
    );

    if (validTokens.length > 0) {
      return { holds: true, balance: validTokens.length, source: 'DB_RECORD' };
    }
    return { holds: false, balance: 0, source: 'DB_RECORD' };
  } catch (err: any) {
    return {
      holds: null,
      balance: null,
      source: 'UNAVAILABLE',
      reason: `DB verification failed: ${err?.message}`,
    };
  }
}

/**
 * Combined ownership verification — tries on-chain first.
 *
 * @param gateMode   - Controls fallback behavior:
 *   'ACCESS_GATE' (default): fail-closed — returns UNAVAILABLE when on-chain fails.
 *                            Use when the result controls whether access is granted.
 *   'INFORMATION': falls back to DB records with transparent labeling.
 *                  Use for Hermes narration, dashboard display, explain tools.
 *
 * @param checkExpiry - When true (default), also checks DB expiresAt after on-chain confirm.
 *                      Set to false only when you need raw on-chain balance without expiry.
 *
 * @param contractAddress - Server-resolved from DB, never from client
 * @param collectionId    - For DB expiry check + fallback (INFORMATION mode)
 * @param walletAddress   - Wallet to verify
 * @param chainId         - Server-resolved from DB
 * @param standard        - From DB
 */
export async function verifyNftAccess(params: {
  contractAddress: string;
  collectionId: string;
  walletAddress: string;
  chainId: number;
  standard: string;
  gateMode?: 'ACCESS_GATE' | 'INFORMATION';
  checkExpiry?: boolean;
}): Promise<TokenGateResult> {
  const mode = params.gateMode ?? 'ACCESS_GATE';
  const checkExpiry = params.checkExpiry !== false; // default true

  const onchain = await verifyOnchainOwnership(
    params.contractAddress,
    params.walletAddress,
    params.chainId,
    params.standard,
  );

  if (onchain.source !== 'UNAVAILABLE') {
    // On-chain confirmed ownership — but also check platform-level expiry (ACCESS_PASS)
    if (checkExpiry && onchain.holds === true) {
      const expiryResult = await checkDbExpiry(params.collectionId, params.walletAddress);
      if (expiryResult.isExpired) {
        return {
          holds: false,
          balance: 0,
          source: 'ONCHAIN',
          reason: `TOKEN_EXPIRED: Token exists on-chain but platform-level expiry has passed (${expiryResult.expiredAt?.toISOString()}).`,
        };
      }
    }
    return onchain;
  }

  // On-chain unavailable:
  if (mode === 'ACCESS_GATE') {
    // Fail-closed: cannot verify ownership → cannot grant access.
    // A revoked, transferred, or burned token could otherwise bypass the gate via stale DB data.
    return {
      holds: null,
      balance: null,
      source: 'UNAVAILABLE',
      reason: `On-chain verification required for access control. RPC unavailable for contract ${params.contractAddress}.`,
    };
  }

  // INFORMATION mode: fallback to DB records with transparent labeling
  console.warn(`[TokenGate] On-chain unavailable for contract ${params.contractAddress}. Falling back to DB (INFORMATION mode).`);
  return verifyDbIssuance(params.collectionId, params.walletAddress);
}

/**
 * Checks if a wallet's token for a collection has passed its platform-level expiresAt.
 * Only relevant for ACCESS_PASS tokens — other types never have expiresAt.
 * Returns isExpired=false when no expiry is configured.
 */
async function checkDbExpiry(
  collectionId: string,
  walletAddress: string,
): Promise<{ isExpired: boolean; expiredAt?: Date }> {
  try {
    const { db } = await import("@saasfly/db-core");
    const { tenantNftIssuances } = await import("@saasfly/db-core");
    const { and, eq } = await import("@saasfly/db-core");

    const rows = await db
      .select({ expiresAt: tenantNftIssuances.expiresAt })
      .from(tenantNftIssuances)
      .where(and(
        eq(tenantNftIssuances.collectionId, collectionId),
        eq(tenantNftIssuances.recipientWallet, walletAddress.toLowerCase()),
        eq(tenantNftIssuances.status, 'minted'),
      ))
      .limit(5);

    // No expiry configured on any of the issuances → not expired
    const withExpiry = rows.filter(r => r.expiresAt !== null);
    if (withExpiry.length === 0) return { isExpired: false };

    // Token expires only when ALL active issuances are expired
    const now = new Date();
    const allExpired = withExpiry.every(r => new Date(r.expiresAt!) < now);

    if (allExpired) {
      const latestExpiry = withExpiry.reduce((latest, r) => {
        const d = new Date(r.expiresAt!);
        return d > latest ? d : latest;
      }, new Date(0));
      return { isExpired: true, expiredAt: latestExpiry };
    }

    return { isExpired: false };
  } catch {
    // DB check failed — do not block access, just log
    console.warn('[TokenGate] checkDbExpiry failed — skipping expiry check.');
    return { isExpired: false };
  }
}

