import { BaseVerticalPaymentAdapter } from './base-adapter';
import { PaymentSettlementEvent, PaymentVertical } from '../core/types';
import { db } from "@saasfly/db-core";
import { purchases, platformEvents } from "@saasfly/db-core";
import { eq, and } from "@saasfly/db-core";
import { isUuid } from '@saasfly/shared';

/**
 * 🏦 RWA (Real World Assets) Adapter
 * Translates a normalized PaymentSettlementEvent into an asset unlock (purchases mutation).
 */
export class RwaPaymentAdapter extends BaseVerticalPaymentAdapter {
  readonly vertical: PaymentVertical = 'RWA';

  async handleSettlement(event: PaymentSettlementEvent): Promise<void> {
    console.log(`[RwaPaymentAdapter] Received settlement for Asset Purchase: ${event.intentId}`);
    
    // In RWA, the intentId typically maps to the purchaseId.
    // If it's a UUID, it's our internal purchase ID. If not, we might need a mapping lookup.
    if (!isUuid(event.intentId)) {
      console.warn(`[RwaPaymentAdapter] intentId ${event.intentId} is not a valid UUID. Cannot resolve purchase.`);
      throw new Error('Invalid purchase ID');
    }

    const [existingPurchase] = await db.select()
      .from(purchases)
      .where(eq(purchases.id, event.intentId))
      .limit(1);

    if (!existingPurchase) {
      throw new Error(`[RwaPaymentAdapter] Purchase record ${event.intentId} not found.`);
    }

    if (existingPurchase.status === 'completed') {
      console.log(`[RwaPaymentAdapter] Purchase ${event.intentId} is already completed. Idempotent skip.`);
      return;
    }

    // Ensure atomicity and concurrency-safe idempotency via transaction
    const settled = await db.transaction(async (tx) => {
      // 1. Atomic Update (only if not already completed)
      const updated = await tx.update(purchases)
        .set({ 
          status: 'completed',
          updatedAt: new Date()
        })
        .where(
          and(
            eq(purchases.id, existingPurchase.id),
            // Ensure we only transition from a non-completed state
            // Depending on the schema, it might be 'pending', but here we just ensure it's not 'completed'
            // If the schema allows other states, we should check them. For now, we rely on the earlier check + this returning clause.
            eq(purchases.status, existingPurchase.status) 
          )
        )
        .returning({ id: purchases.id });

      if (updated.length === 0) {
        return false;
      }

      // 2. Emit the domain event to the Event Spine atomically
      // The eventId is deterministic to prevent duplicate events on retry
      await tx.insert(platformEvents).values({
        eventId: `evt_rwa_settled_${event.intentId}`,
        eventType: 'rwa.purchase.settled',
        identityId: existingPurchase.userId,
        correlationId: event.intentId,
        sourceSystem: 'PaymentCore.RwaAdapter',
        organizationId: event.organizationId,
        projectId: String(existingPurchase.projectId),
        occurredAt: new Date(),
        payload: {
          purchaseId: existingPurchase.id,
          amount: event.amount,
          currency: event.currency,
          provider: event.provider,
          providerTransactionId: event.providerTransactionId,
        }
      });

      return true;
    });

    if (!settled) {
      console.log(`[RwaPaymentAdapter] Purchase ${event.intentId} state changed concurrently. Idempotent skip.`);
      return;
    }

    console.log(`[RwaPaymentAdapter] Successfully settled RWA purchase ${event.intentId} for tenant ${event.organizationId}`);
  }
}
