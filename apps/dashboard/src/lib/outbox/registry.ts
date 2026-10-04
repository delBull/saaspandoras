import { OutboxEvent } from "./repository";

export interface OutboxEventHandler {
  (event: OutboxEvent): Promise<void>;
}

export class EventRegistry {
  private handlers = new Map<string, OutboxEventHandler>();

  /**
   * Register a handler for a specific aggregate type and event type.
   * e.g. register('governance', 'proposal_created', handler)
   */
  register(aggregateType: string, eventType: string, handler: OutboxEventHandler) {
    const key = this.getKey(aggregateType, eventType);
    if (this.handlers.has(key)) {
      console.warn(`[Outbox] Overwriting handler for ${key}`);
    }
    this.handlers.set(key, handler);
  }

  /**
   * Get the handler for a specific event.
   */
  getHandler(aggregateType: string, eventType: string): OutboxEventHandler | undefined {
    return this.handlers.get(this.getKey(aggregateType, eventType));
  }

  private getKey(aggregateType: string, eventType: string): string {
    return `${aggregateType}::${eventType}`;
  }
}

// Global registry instance
export const registry = new EventRegistry();

// ── NFT Lab handlers (multi-tenant NFT deployer + issuance confirmation) ──
import { executeNftCollectionDeploy as executeNftCollectionDeployShared } from '@saasfly/nexus-deals-sdk';

// Deploy was requested post-governance; idempotently deploy the contract.
// Only processes 'GOVERNANCE_PENDING' collections with an approved intent.
registry.register('nft_collection', 'collection.deploy', async (event) => {
  console.log(`[Outbox::NFT] Deploy requested: ${event.aggregateId}`);
  const orgId = String(event.organizationId || '').replace(/^org_/, '');
  if (!orgId) {
    console.warn(`[Outbox::NFT] Cannot deploy: missing organizationId for ${event.aggregateId}`);
    return;
  }
  // The aggregateId is the collection row; the executor seeks the governance
  // intent already APPROVED for this collection. Scope: canonical org.
  const { executeNftCollectionDeploy } = await import('@saasfly/nexus-deals-sdk');
  await executeNftCollectionDeploy(String(event.aggregateId), orgId);
});

registry.register('nft_issuance', 'token.issued', async (event) => {
  // token.issued is emitted by nft-mint-executor AFTER on-chain confirmation.
  // Downstream: Hermes notification, CRM update, Portal refresh.
  const payload = event.payload as any;
  console.log(
    `[Outbox::NFT] token.issued confirmed on-chain — issuance: ${event.aggregateId} | ` +
    `tokenId: ${payload.tokenId} | txHash: ${payload.txHash} | recipient: ${payload.recipientWallet}`
  );
  // Hermes Omnipresente picks up this event via vigilanceSnapshot for proactive narration.
  // No additional action needed here — executor already updated DB and emitted the event.
});

// ── purchase.completed → NFT auto-issuance automation binding ─────────────────
// When a purchase completes (USDC settlement confirmed), check if the project
// has an NFT automation rule configured. If so, automatically issue the
// configured certificate/membership token to the buyer's wallet.
//
// Configuration is stored in: installedProducts.capabilities.nftAutomation
// Structure: { enabled: true, collectionId: '<uuid>', purpose: 'CERTIFICATE' }
//
// Authority: this is an automated system action — no governance intent required
// because the governance was obtained when the NFT product + rule was configured.
registry.register('purchase', 'purchase.completed', async (event) => {
  const payload = event.payload as any;
  const orgId = String(event.organizationId || '').replace(/^org_/, '');

  if (!orgId) {
    console.warn('[Outbox::NFT::AutoMint] Missing organizationId — skipping.');
    return;
  }

  const recipientWallet = payload.buyerWallet || payload.recipientWallet;
  const projectId = payload.projectId;
  const purchaseId = payload.purchaseId || event.aggregateId;

  if (!recipientWallet || !projectId) {
    console.warn(`[Outbox::NFT::AutoMint] Missing recipientWallet or projectId for purchase ${purchaseId}`);
    return;
  }

  // 1. Check if project has NFT automation configured in installedProducts
  const { db } = await import('@/db');
  const { installedProducts } = await import('@/db/schema');
  const { and, eq } = await import('drizzle-orm');

  const [product] = await db
    .select({ capabilities: installedProducts.capabilities })
    .from(installedProducts)
    .where(and(
      eq(installedProducts.projectId, Number(projectId)),
      eq(installedProducts.product as any, 'NFT_LAB'),
      eq(installedProducts.status as any, 'active'),
    ))
    .limit(1);

  if (!product) {
    // No NFT Lab product active — nothing to do
    return;
  }

  const nftAutomation = (product.capabilities as any)?.nftAutomation;
  if (!nftAutomation?.enabled || !nftAutomation?.collectionId) {
    // Automation not configured — log and skip
    console.log(`[Outbox::NFT::AutoMint] No automation rule for project ${projectId} — skipping.`);
    return;
  }

  console.log(
    `[Outbox::NFT::AutoMint] Auto-minting NFT for purchase ${purchaseId} ` +
    `→ collection ${nftAutomation.collectionId} → wallet ${recipientWallet}`
  );

  // 2. Issue token via NftCapability (handles policy + governance decision)
  try {
    const { NftCapability } = await import('@saasfly/nexus-deals-sdk');
    const result = await NftCapability.issueToken({
      tenantId: orgId,
      projectId: Number(projectId),
      collectionId: nftAutomation.collectionId,
      recipientWallet: String(recipientWallet),
      actorId: 'system:purchase_automation',
      metadata: {
        purchaseId,
        automationTrigger: 'purchase.completed',
        purchaseAmount: payload.amount,
        purchaseCurrency: payload.currency,
      },
    });

    if (result.status === 'issued' || result.status === 'pending_governance') {
      console.log(
        `[Outbox::NFT::AutoMint] Result: ${result.status} — issuanceId: ${result.issuanceId} ` +
        `| governanceIntentId: ${result.governanceIntentId ?? 'N/A'}`
      );
    } else {
      console.warn(`[Outbox::NFT::AutoMint] Issue denied: ${result.reason}`);
    }
  } catch (err: any) {
    console.error(`[Outbox::NFT::AutoMint] Failed to issue token for purchase ${purchaseId}:`, err?.message);
    throw err; // Re-throw so outbox processor marks as failed + retries
  }
});

