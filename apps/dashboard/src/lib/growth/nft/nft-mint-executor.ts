/**
 * 🔨 NFT Mint Executor
 * lib/growth/nft/nft-mint-executor.ts
 *
 * Performs the actual on-chain NFT mint AFTER governance approval
 * (or auto-approved path via NftCapability.issueToken ALLOW_AUTO).
 *
 * Called ONLY by:
 *   - /api/v1/control-plane/intents (after APPROVE of growth.nft.mint.v1)
 *   - NftCapability.issueToken ALLOW_AUTO path (via internal dispatch)
 *
 * Authority model:
 *   - Executor is called ONLY with an existing issuanceId or intentId
 *   - contractAddress + chainId resolved from tenant_nft_collections (DB — server-side)
 *   - recipientWallet resolved from tenant_nft_issuances (DB — server-side)
 *   - Oracle wallet is server-resolved via getPandoraOracleWallet (never from client)
 *   - idempotency: checks issuance status before executing — skips if already 'minted'
 *
 * Failure handling:
 *   - On RPC / contract failure: issuance status → 'mint_failed' with error in metadata
 *   - outbox 'token.mint_failed' emitted — never 'token.issued'
 *   - Re-throws for caller logging
 *   - NEVER emits 'token.issued' without a confirmed txHash
 *
 * Lifecycle:
 *   pending_mint → (executor runs) → minted (success) | mint_failed (error)
 */

import { db } from '@/db';
import {
  tenantNftCollections,
  tenantNftIssuances,
  outboxEvents,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Minimal ERC-721 mint ABI — covers W2ELicense and PandorasKey contracts
const MINT_ABI = [
  'function mintTo(address to) external returns (uint256)',
  'function safeMint(address to) external returns (uint256)',
  'function mint(address to) external returns (uint256)',
];

// ERC-721 Transfer event — used to extract tokenId from receipt
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

/**
 * Resolves the network RPC endpoint for a chainId.
 * Uses env-configured premium RPC when available (same strategy as token-gate.ts).
 */
function getRpcUrl(chainId: number): string {
  switch (chainId) {
    case 8453:   return process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    case 84532:  return process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
    case 11155111: return process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
    default:     throw new Error(`[NftMintExecutor] Unsupported chainId: ${chainId}`);
  }
}

/**
 * Attempt to call mintTo / safeMint / mint on the contract.
 * Returns { txHash, tokenId }. Throws on failure.
 */
async function callMintOnChain(
  contractAddress: string,
  recipientWallet: string,
  chainId: number,
  signerKey: string,
): Promise<{ txHash: string; tokenId: string }> {
  const { ethers } = await import('ethers');
  const rpcUrl = getRpcUrl(chainId);
  // ethers v5 — StaticJsonRpcProvider via ethers namespace
  const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl, { name: `chain-${chainId}`, chainId });
  const signer = new ethers.Wallet(signerKey, provider);
  const contract = new ethers.Contract(contractAddress, MINT_ABI, signer);

  // Try mintTo first, then safeMint, then mint
  let txResponse: any = null;
  const mintFunctions = ['mintTo', 'safeMint', 'mint'];

  for (const fnName of mintFunctions) {
    try {
      if (typeof contract[fnName] === 'function') {
        txResponse = await contract[fnName](recipientWallet, { gasLimit: 300_000 });
        break;
      }
    } catch (err: any) {
      if (err?.code === 'INVALID_ARGUMENT' || err?.code === 'CALL_EXCEPTION') continue;
      throw err;
    }
  }

  if (!txResponse) {
    throw new Error('[NftMintExecutor] No compatible mint function found on contract ABI.');
  }

  // Wait for confirmation (1 block)
  const receipt = await Promise.race([
    txResponse.wait(1),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Mint confirmation timeout after 60s')), 60_000)
    ),
  ]) as any;

  if (!receipt || receipt.status !== 1) {
    throw new Error(`[NftMintExecutor] Transaction reverted. Hash: ${txResponse.hash}`);
  }

  // Extract tokenId from Transfer event logs
  const txHash = receipt.transactionHash;
  let tokenId = 'unknown';
  for (const log of receipt.logs) {
    if (log.topics[0]?.toLowerCase() === TRANSFER_TOPIC) {
      if (log.topics[3]) {
        tokenId = BigInt(log.topics[3]).toString();
        break;
      }
    }
  }

  return { txHash, tokenId };
}

/**
 * Execute an NFT mint for an existing issuance record.
 *
 * @param issuanceId  - UUID of the tenant_nft_issuances row (status must be 'pending_mint')
 * @param organizationId - Canonical org ID (for tenant isolation check)
 */
export async function executeNftMint(
  issuanceId: string,
  organizationId: string,
): Promise<void> {

  const normalizedOrg = organizationId.replace(/^org_/, '').toLowerCase();

  // ── 1. Load issuance ────────────────────────────────────────────────────
  const [issuance] = await db
    .select()
    .from(tenantNftIssuances)
    .where(eq(tenantNftIssuances.id, issuanceId))
    .limit(1);

  if (!issuance) {
    throw new Error(`[NftMintExecutor] Issuance ${issuanceId} not found.`);
  }

  // ── 2. Idempotency: skip if already processed ───────────────────────────
  if (issuance.status === 'minted') {
    console.log(`[NftMintExecutor] Issuance ${issuanceId} already minted. Idempotent skip.`);
    return;
  }

  if (issuance.status === 'revoked') {
    throw new Error(`[NftMintExecutor] Issuance ${issuanceId} is revoked. Cannot mint.`);
  }

  // ── 3. Load collection + tenant isolation ──────────────────────────────
  const [collection] = await db
    .select()
    .from(tenantNftCollections)
    .where(and(
      eq(tenantNftCollections.id, issuance.collectionId),
      eq(tenantNftCollections.organizationId, normalizedOrg),
    ))
    .limit(1);

  if (!collection) {
    throw new Error(
      `[NftMintExecutor] TENANT ISOLATION VIOLATION or collection not found: ` +
      `issuance ${issuanceId} / org '${organizationId}'.`
    );
  }

  if (!collection.contractAddress) {
    throw new Error(
      `[NftMintExecutor] Collection ${collection.id} is not deployed on-chain. Cannot mint.`
    );
  }

  if (collection.status !== 'DEPLOYED') {
    throw new Error(
      `[NftMintExecutor] Collection ${collection.id} status is '${collection.status}'. Must be DEPLOYED.`
    );
  }

  // ── 4. Resolve oracle signer key (never from client) ──────────────────
  const oracleKey = process.env.PANDORAS_ORACLE_PRIVATE_KEY;
  if (!oracleKey) {
    throw new Error('[NftMintExecutor] PANDORAS_ORACLE_PRIVATE_KEY is required for on-chain mint.');
  }

  console.log(
    `[NftMintExecutor] Minting: collection ${collection.id} → ${issuance.recipientWallet} ` +
    `| contract: ${collection.contractAddress} | chainId: ${collection.chainId}`
  );

  // ── 5. Execute on-chain mint ───────────────────────────────────────────
  let txHash: string;
  let tokenId: string;

  try {
    ({ txHash, tokenId } = await callMintOnChain(
      collection.contractAddress,
      issuance.recipientWallet,
      collection.chainId,
      oracleKey,
    ));
  } catch (mintErr: any) {
    // ── Mint failure: honest state — never 'minted', never 'token.issued' ──
    console.error(
      `[NftMintExecutor] On-chain mint failed for issuance ${issuanceId}:`,
      mintErr?.message
    );

    await db
      .update(tenantNftIssuances)
      .set({
        status: 'mint_failed',
        metadata: {
          ...(issuance.metadata as Record<string, unknown> || {}),
          mintError: mintErr?.message || 'Unknown mint error',
          mintFailedAt: new Date().toISOString(),
        },
      })
      .where(eq(tenantNftIssuances.id, issuanceId));

    // Emit failure event — never 'token.issued'
    await db.insert(outboxEvents).values({
      organizationId: normalizedOrg,
      aggregateType: 'nft_issuance',
      aggregateId: issuanceId,
      eventType: 'token.mint_failed',
      payload: {
        issuanceId,
        collectionId: issuance.collectionId,
        recipientWallet: issuance.recipientWallet,
        error: mintErr?.message || 'Unknown mint error',
        tenantId: normalizedOrg,
      },
      status: 'pending',
    }).catch(e => console.warn('[NftMintExecutor] Outbox event failed:', e));

    throw mintErr; // Re-throw for caller
  }

  // ── 6. Persist confirmed mint state ────────────────────────────────────
  await db
    .update(tenantNftIssuances)
    .set({
      status: 'minted',
      mintTxHash: txHash,
      tokenId,
      mintedAt: new Date(),
      metadata: {
        ...(issuance.metadata as Record<string, unknown> || {}),
        txHash,
        tokenId,
        chainId: collection.chainId,
        contractAddress: collection.contractAddress,
        mintedAt: new Date().toISOString(),
      },
    })
    .where(eq(tenantNftIssuances.id, issuanceId));

  // ── 7. Emit token.issued ONLY after on-chain confirmation ──────────────
  await db.insert(outboxEvents).values({
    organizationId: normalizedOrg,
    aggregateType: 'nft_issuance',
    aggregateId: issuanceId,
    eventType: 'token.issued',
    payload: {
      issuanceId,
      collectionId: issuance.collectionId,
      recipientWallet: issuance.recipientWallet,
      txHash,
      tokenId,
      chainId: collection.chainId,
      contractAddress: collection.contractAddress,
      tenantId: normalizedOrg,
    },
    status: 'pending',
  }).catch(e => console.warn('[NftMintExecutor] Outbox event failed:', e));

  // ── 8. Audit log ───────────────────────────────────────────────────────
  try {
    const { SecurityAuditLogger } = await import(
      '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger'
    );
    await SecurityAuditLogger.logEvent({
      organizationId: normalizedOrg,
      actorId: `executor:nft_mint`,
      eventType: 'EXECUTIVE_ACTION_EXECUTED',
      severity: 'INFO',
      policyDecision: 'ALLOW',
      correlationId: issuanceId,
      metadata: {
        event: 'nft_token.minted',
        issuanceId,
        collectionId: issuance.collectionId,
        recipientWallet: issuance.recipientWallet,
        txHash,
        tokenId,
        contractAddress: collection.contractAddress,
        chainId: collection.chainId,
      },
    });
  } catch (auditErr) {
    console.warn('[NftMintExecutor] Audit log failed (non-fatal):', auditErr);
  }

  console.log(
    `[NftMintExecutor] ✅ Minted: tokenId=${tokenId} | txHash=${txHash} ` +
    `| issuance: ${issuanceId} | recipient: ${issuance.recipientWallet}`
  );
}

/**
 * Resolve issuanceId from a governance intent rationale.
 * The intent rationale contains "Issuance: <uuid>" when created via REQUIRE_GOVERNANCE path.
 * Falls back to loading by collectionId + recipientWallet from intent objective.
 */
export async function resolveIssuanceIdFromIntent(intentId: string): Promise<string | null> {
  const { operationalIntents } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');

  const [intent] = await db
    .select({ rationale: operationalIntents.rationale, objective: operationalIntents.objective })
    .from(operationalIntents)
    .where(eq(operationalIntents.id, intentId))
    .limit(1);

  if (!intent) return null;

  // Try to extract issuanceId from rationale "Issuance: <uuid>"
  const rationaleMatch = intent.rationale?.match(/Issuance:\s+([a-f0-9-]{36})/i);
  if (rationaleMatch?.[1]) return rationaleMatch[1];

  return null;
}
