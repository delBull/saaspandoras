/**
 * 🗑️ NFT Revoke Executor
 * lib/growth/nft/nft-revoke-executor.ts
 *
 * Performs the actual on-chain NFT revocation AFTER governance approval
 * (growth.nft.revoke.v1 intent).
 *
 * Revocation model:
 *   - For transferable tokens: calls burn() on the contract (destroys token)
 *   - For non-transferable (SBT/IDENTITY): calls revoke() or burn() — oracle wallet must be owner/admin
 *   - DB issuance status → 'revoked' ONLY after on-chain confirmation
 *   - 'token.revoked' outbox ONLY after on-chain confirmation
 *
 * Authority model:
 *   - Called ONLY after governance APPROVE of growth.nft.revoke.v1
 *   - tokenId + contractAddress resolved from DB (server-side)
 *   - Oracle wallet (signer) from env — never from client
 *   - idempotency: skip if already revoked
 */

import { db } from '@/db';
import {
  tenantNftCollections,
  tenantNftIssuances,
  operationalIntents,
  outboxEvents,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Minimal revoke/burn ABI — covers W2ELicense and PandorasKey contracts
const REVOKE_ABI = [
  'function revoke(uint256 tokenId) external',
  'function burn(uint256 tokenId) external',
  'function adminBurn(uint256 tokenId) external',
];

function getRpcUrl(chainId: number): string {
  switch (chainId) {
    case 8453:     return process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    case 84532:    return process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
    case 11155111: return process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
    default: throw new Error(`[NftRevokeExecutor] Unsupported chainId: ${chainId}`);
  }
}

async function callRevokeOnChain(
  contractAddress: string,
  tokenId: string,
  chainId: number,
  signerKey: string,
): Promise<{ txHash: string }> {
  const { ethers } = await import('ethers');
  const rpcUrl = getRpcUrl(chainId);
  const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl, { name: `chain-${chainId}`, chainId });
  const signer = new ethers.Wallet(signerKey, provider);
  const contract = new ethers.Contract(contractAddress, REVOKE_ABI, signer);

  const tokenIdBN = BigInt(tokenId);
  let txResponse: any = null;

  // Try revoke → adminBurn → burn in order
  for (const fnName of ['revoke', 'adminBurn', 'burn']) {
    try {
      if (typeof contract[fnName] === 'function') {
        txResponse = await contract[fnName](tokenIdBN, { gasLimit: 200_000 });
        break;
      }
    } catch (err: any) {
      if (err?.code === 'INVALID_ARGUMENT' || err?.code === 'CALL_EXCEPTION') continue;
      throw err;
    }
  }

  if (!txResponse) {
    throw new Error('[NftRevokeExecutor] No compatible revoke/burn function found on contract ABI.');
  }

  const receipt = await Promise.race([
    txResponse.wait(1),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Revoke confirmation timeout after 60s')), 60_000)
    ),
  ]) as any;

  if (!receipt || receipt.status !== 1) {
    throw new Error(`[NftRevokeExecutor] Transaction reverted. Hash: ${txResponse.hash}`);
  }

  return { txHash: receipt.transactionHash };
}

/**
 * Resolves the issuanceId from a revoke intent's rationale.
 * Rationale contains: "Revoke NFT issuance <uuid>"
 */
async function resolveIssuanceIdFromRevokeIntent(intentId: string): Promise<string | null> {
  const [intent] = await db
    .select({ objective: operationalIntents.objective, rationale: operationalIntents.rationale })
    .from(operationalIntents)
    .where(eq(operationalIntents.id, intentId))
    .limit(1);

  if (!intent) return null;

  // Objective: "Revoke NFT issuance <uuid>"
  const match = intent.objective?.match(/Revoke NFT issuance\s+([a-f0-9-]{36})/i);
  if (match?.[1]) return match[1];

  return null;
}

/**
 * Execute an NFT revocation for an existing issuance record.
 *
 * @param intentId       - Governance intent ID (growth.nft.revoke.v1)
 * @param organizationId - Canonical org ID (for tenant isolation)
 */
export async function executeNftRevoke(
  intentId: string,
  organizationId: string,
): Promise<void> {

  const normalizedOrg = organizationId.replace(/^org_/, '').toLowerCase();

  // ── 1. Resolve issuanceId from intent ──────────────────────────────────
  const issuanceId = await resolveIssuanceIdFromRevokeIntent(intentId);
  if (!issuanceId) {
    throw new Error(`[NftRevokeExecutor] Cannot resolve issuanceId from intent ${intentId}.`);
  }

  // ── 2. Load issuance ───────────────────────────────────────────────────
  const [issuance] = await db
    .select()
    .from(tenantNftIssuances)
    .where(eq(tenantNftIssuances.id, issuanceId))
    .limit(1);

  if (!issuance) {
    throw new Error(`[NftRevokeExecutor] Issuance ${issuanceId} not found.`);
  }

  // ── 3. Idempotency ─────────────────────────────────────────────────────
  if (issuance.status === 'revoked') {
    console.log(`[NftRevokeExecutor] Issuance ${issuanceId} already revoked. Idempotent skip.`);
    return;
  }

  if (issuance.status !== 'minted') {
    throw new Error(
      `[NftRevokeExecutor] Issuance ${issuanceId} status is '${issuance.status}'. ` +
      `Only 'minted' tokens can be revoked on-chain.`
    );
  }

  if (!issuance.tokenId) {
    throw new Error(
      `[NftRevokeExecutor] Issuance ${issuanceId} has no tokenId. Cannot revoke without token ID.`
    );
  }

  // ── 4. Load collection + tenant isolation ─────────────────────────────
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
      `[NftRevokeExecutor] TENANT ISOLATION VIOLATION or collection not found for ` +
      `issuance ${issuanceId} / org '${organizationId}'.`
    );
  }

  if (!collection.contractAddress) {
    throw new Error(`[NftRevokeExecutor] Collection ${collection.id} has no contractAddress.`);
  }

  // ── 5. Oracle signer ──────────────────────────────────────────────────
  const oracleKey = process.env.PANDORAS_ORACLE_PRIVATE_KEY;
  if (!oracleKey) {
    throw new Error('[NftRevokeExecutor] PANDORAS_ORACLE_PRIVATE_KEY is required for on-chain revocation.');
  }

  console.log(
    `[NftRevokeExecutor] Revoking tokenId=${issuance.tokenId} ` +
    `| contract: ${collection.contractAddress} | issuance: ${issuanceId}`
  );

  // ── 6. Execute on-chain revocation ────────────────────────────────────
  let txHash: string;

  try {
    ({ txHash } = await callRevokeOnChain(
      collection.contractAddress,
      issuance.tokenId,
      collection.chainId,
      oracleKey,
    ));
  } catch (revokeErr: any) {
    console.error(
      `[NftRevokeExecutor] On-chain revoke failed for issuance ${issuanceId}:`,
      revokeErr?.message
    );

    await db.insert(outboxEvents).values({
      organizationId: normalizedOrg,
      aggregateType: 'nft_issuance',
      aggregateId: issuanceId,
      eventType: 'token.revoke_failed',
      payload: {
        issuanceId,
        collectionId: issuance.collectionId,
        tokenId: issuance.tokenId,
        error: revokeErr?.message || 'Unknown revoke error',
        tenantId: normalizedOrg,
      },
      status: 'pending',
    }).catch(e => console.warn('[NftRevokeExecutor] Outbox event failed:', e));

    throw revokeErr;
  }

  // ── 7. Persist confirmed revocation ──────────────────────────────────
  await db
    .update(tenantNftIssuances)
    .set({
      status: 'revoked',
      revokedAt: new Date(),
      revokedBy: `executor:intent_${intentId}`,
      metadata: {
        ...(issuance.metadata as Record<string, unknown> || {}),
        revokeTxHash: txHash,
        revokedAt: new Date().toISOString(),
        revokeIntentId: intentId,
      },
    })
    .where(eq(tenantNftIssuances.id, issuanceId));

  // ── 8. Emit token.revoked ONLY after on-chain confirmation ─────────────
  await db.insert(outboxEvents).values({
    organizationId: normalizedOrg,
    aggregateType: 'nft_issuance',
    aggregateId: issuanceId,
    eventType: 'token.revoked',
    payload: {
      issuanceId,
      collectionId: issuance.collectionId,
      recipientWallet: issuance.recipientWallet,
      tokenId: issuance.tokenId,
      txHash,
      tenantId: normalizedOrg,
      intentId,
    },
    status: 'pending',
  }).catch(e => console.warn('[NftRevokeExecutor] Outbox event failed:', e));

  // ── 9. Audit log ───────────────────────────────────────────────────────
  try {
    const { SecurityAuditLogger } = await import(
      '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger'
    );
    await SecurityAuditLogger.logEvent({
      organizationId: normalizedOrg,
      actorId: `executor:nft_revoke`,
      eventType: 'EXECUTIVE_ACTION_EXECUTED',
      severity: 'WARN',
      policyDecision: 'ALLOW',
      correlationId: intentId,
      metadata: {
        event: 'nft_token.revoked',
        issuanceId,
        tokenId: issuance.tokenId,
        txHash,
        contractAddress: collection.contractAddress,
        chainId: collection.chainId,
        intentId,
      },
    });
  } catch (auditErr) {
    console.warn('[NftRevokeExecutor] Audit log failed (non-fatal):', auditErr);
  }

  console.log(
    `[NftRevokeExecutor] ✅ Revoked: tokenId=${issuance.tokenId} | txHash=${txHash} | issuance: ${issuanceId}`
  );
}
