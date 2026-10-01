/**
 * 🔧 NFT Collection Deploy Executor
 * lib/growth/nft/nft-deploy-executor.ts
 *
 * Invoked AFTER governance approval of a 'growth.nft.collection.v1' intent.
 * Responsible for:
 *   1. Loading the collection definition from tenant_nft_collections
 *   2. Resolving the deployer wallet (server-side, from projects table — NOT from client)
 *   3. Calling deployNFTPassServer() from @pandoras/protocol-deployer
 *   4. Persisting the contract address + deployTxHash to the collection record
 *   5. Emitting collection.deployed outbox event for Hermes/downstream consumers
 *   6. Logging via SecurityAuditLogger
 *
 * Failure handling:
 *   - On RPC / deployment failure: collection status reverts to GOVERNANCE_PENDING
 *     with an error message in config.lastDeployError
 *   - Caller (governance approval route) catches executor errors and logs them.
 *   - Never silently swallows errors — always updates collection status honestly.
 *
 * Authority model:
 *   - Executor is called ONLY after governance approval (operationalApprovals record exists)
 *   - Owner wallet is resolved from projects.applicantWalletAddress (DB, server-side)
 *   - Treasury defaults to owner wallet — never a client-supplied value
 *   - intentId is the traceability anchor for this execution
 */

import { db } from '@/db';
import {
  tenantNftCollections,
  projects,
  outboxEvents,
  installedProducts,
} from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';

/**
 * Resolves the network for deployment.
 * Backend-determined: production = Base Mainnet, anything else = Sepolia testnet.
 */
function resolveNetwork(): 'base' | 'sepolia' {
  return process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'
    || process.env.NODE_ENV === 'production'
    ? 'base'
    : 'sepolia';
}

/**
 * Maps NftPurpose + NftStandard to the deployer's nftType parameter.
 * 'identity' → PandorasKey contract (SBT-like, non-transferable)
 * else       → W2ELicense contract (configurable transferable/burnable)
 */
function resolveNftType(purpose: string, standard: string): string {
  if (purpose === 'IDENTITY' || standard === 'SBT') return 'identity';
  return 'access';
}

export async function executeNftCollectionDeploy(
  intentId: string,
  organizationId: string,
): Promise<void> {

  // ── 1. Load collection by governance intent ID ────────────────────────
  const [collection] = await db
    .select()
    .from(tenantNftCollections)
    .where(eq(tenantNftCollections.governanceIntentId, intentId))
    .limit(1);

  if (!collection) {
    throw new Error(`[NftDeployExecutor] No collection found for intentId: ${intentId}`);
  }

  // ── 2. Verify tenant isolation (belt-and-suspenders) ─────────────────
  const normalizedCollectionOrg = collection.organizationId.toLowerCase();
  const normalizedActingOrg = organizationId.replace(/^org_/, '').toLowerCase();
  if (!normalizedCollectionOrg.includes(normalizedActingOrg) &&
      !normalizedActingOrg.includes(normalizedCollectionOrg)) {
    throw new Error(
      `[NftDeployExecutor] TENANT ISOLATION VIOLATION: intent org '${organizationId}' ≠ collection org '${collection.organizationId}'`
    );
  }

  // ── 3. Resolve owner wallet (server-authoritative, NEVER from client) ─
  const [project] = await db
    .select({ wallet: projects.applicantWalletAddress })
    .from(projects)
    .where(or(
      eq(projects.id, collection.projectId),
      eq(projects.organizationId, collection.organizationId),
    ))
    .limit(1);

  if (!project?.wallet) {
    throw new Error(`[NftDeployExecutor] No deployer wallet found for project ${collection.projectId}`);
  }

  const network = resolveNetwork();
  const nftType = resolveNftType(collection.purpose, collection.standard);

  const deployConfig = {
    name: collection.name,
    symbol: collection.symbol,
    maxSupply: collection.totalSupply || 999_999,
    price: '0',                        // Free mint by default — tenant cannot override pricing from UI without plan gate
    owner: project.wallet as string,   // Server-resolved: NEVER from client body
    treasuryAddress: project.wallet as string, // Tenant's own wallet — never Pandoras treasury
    transferable: collection.transferable,
    burnable: collection.burnable,
    nftType,
  };

  console.log(
    `[NftDeployExecutor] Deploying: "${deployConfig.name}" (${deployConfig.symbol}) ` +
    `| network: ${network} | org: ${collection.organizationId}`
  );

  // ── 4. Deploy on-chain via protocol-deployer ──────────────────────────
  let contractAddress: string;

  // ── 4a. Fee routing: WHO pays the deployment gas? ─────────────────────
  // Production Truth (post-decouple): deployment cost belongs to the tenant.
  // Pandoras/S'Narai (own tenant, billingExempt) keep platform-wallet deploy.
  const [nftLabRow] = await db
    .select({ config: installedProducts.config })
    .from(installedProducts)
    .where(and(
      eq(installedProducts.projectId, collection.projectId),
      eq(installedProducts.productFamily, 'NFT_LAB'),
    ))
    .limit(1);
  const rowConfig = (nftLabRow?.config as any) || {};
  const isBillingExempt = (rowConfig.billingExempt === true);

  if (!isBillingExempt) {
    // ── TENANT PAYS: no auto server-side deploy with the platform wallet ──
    console.warn(`[NftDeployExecutor] TENANT_PAYS deployment for collection ${collection.id} — awaiting tenant wallet deploy via front-end.`);
    await db.insert(outboxEvents).values({
      organizationId: collection.organizationId,
      aggregateType: 'nft_collection',
      aggregateId: collection.id,
      eventType: 'collection.awaiting_tenant_deploy',
      payload: {
        collectionId: collection.id,
        deployFeePolicy: 'TENANT_PAYS',
        deployConfig: {
          name: deployConfig.name, symbol: deployConfig.symbol,
          maxSupply: deployConfig.maxSupply, price: deployConfig.price,
          owner: deployConfig.owner, treasuryAddress: deployConfig.treasuryAddress,
          transferable: deployConfig.transferable, burnable: deployConfig.burnable,
          nftType, network,
        },
      },
      status: 'pending',
    });
    return; // Honest exit — no contract was deployed with platform funds.
  }

  // ── PLATFORM pays (billingExempt only) ─────────────────────────────────
  try {
    const { deployNFTPassServer } = await import('@pandoras/protocol-deployer');
    contractAddress = await deployNFTPassServer(deployConfig as any, network);
  } catch (deployErr: any) {
    // ── Deployment failure: revert to GOVERNANCE_PENDING with error note ─
    console.error(`[NftDeployExecutor] Deployment failed for collection ${collection.id}:`, deployErr?.message);

    await db
      .update(tenantNftCollections)
      .set({
        status: 'GOVERNANCE_PENDING', // Honest — not deployed, not retired
        config: {
          ...(collection.config as Record<string, unknown> || {}),
          lastDeployError: deployErr?.message || 'Unknown deployment error',
          lastDeployAttemptAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(eq(tenantNftCollections.id, collection.id));

    // Emit failure event so Hermes can notify the tenant
    await db.insert(outboxEvents).values({
      organizationId: collection.organizationId,
      aggregateType: 'nft_collection',
      aggregateId: collection.id,
      eventType: 'collection.deploy_failed',
      payload: {
        collectionId: collection.id,
        intentId,
        error: deployErr?.message || 'Unknown deployment error',
        network,
      },
      status: 'pending',
    });

    throw deployErr; // Re-throw so caller logs it
  }

  // ── 5. Persist deployed state ─────────────────────────────────────────
  await db
    .update(tenantNftCollections)
    .set({
      status: 'DEPLOYED',
      contractAddress,
      deployTxHash: `pending_lookup:${contractAddress}`, // deployNFTPassServer returns address only; txHash resolved async
      deployedAt: new Date(),
      chainId: network === 'base' ? 8453 : 84532,
      updatedAt: new Date(),
    })
    .where(eq(tenantNftCollections.id, collection.id));

  // ── 6. Emit collection.deployed outbox event ──────────────────────────
  await db.insert(outboxEvents).values({
    organizationId: collection.organizationId,
    aggregateType: 'nft_collection',
    aggregateId: collection.id,
    eventType: 'collection.deployed',
    payload: {
      collectionId: collection.id,
      name: collection.name,
      symbol: collection.symbol,
      purpose: collection.purpose,
      standard: collection.standard,
      contractAddress,
      network,
      chainId: network === 'base' ? 8453 : 84532,
      intentId,
      tenantId: collection.organizationId,
    },
    status: 'pending',
  });

  // ── 7. Audit log ──────────────────────────────────────────────────────
  try {
    const { SecurityAuditLogger } = await import(
      '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger'
    );
    await SecurityAuditLogger.logEvent({
      organizationId: collection.organizationId,
      actorId: `executor:nft_deploy`,
      eventType: 'EXECUTIVE_ACTION_EXECUTED',
      severity: 'INFO',
      policyDecision: 'ALLOW',
      correlationId: intentId,
      metadata: {
        event: 'nft_collection.deployed',
        collectionId: collection.id,
        contractAddress,
        network,
        intentId,
      },
    });
  } catch (auditErr) {
    // Audit failure is non-fatal — deployment already completed
    console.warn('[NftDeployExecutor] Audit log failed (non-fatal):', auditErr);
  }

  console.log(
    `[NftDeployExecutor] ✅ Deployed: ${contractAddress} | collection: ${collection.id} | org: ${collection.organizationId}`
  );
}
