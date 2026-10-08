import { db } from '@saasfly/db-core';
import { paymentInboxEvents, type PaymentInboxEvent } from '@saasfly/db-core/schema';
import { eq, and, lte, desc, sql } from '@saasfly/db-core';

export class PaymentCoreService {
  /**
   * Processes a newly arrived or pending payment webhook/event.
   * Ensures strict idempotency via the payment_inbox_events table using a Lease pattern (H13).
   */
  public static async processIncomingPaymentEvent(
    providerEventId: string,
    provider: 'STRIPE' | 'THIRDWEB' | 'WIRE' | 'EXECUTIVE',
    paymentIntentId: string | null,
    payload: any,
    fulfill: (settlement: any) => Promise<void>
  ) {
    const now = new Date();
    const leaseTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minute lease

    // 1. Idempotency Check & Atomic Claim (H13)
    const [inserted] = await db.insert(paymentInboxEvents).values({
      id: providerEventId,
      provider,
      paymentIntentId,
      payload,
      status: 'PROCESSING',
      claimedAt: now,
      leaseExpiresAt: leaseTime,
      attemptCount: 1
    }).onConflictDoNothing({ target: [paymentInboxEvents.id] }).returning();

    let event = inserted;

    if (!event) {
      const existing = await db.query.paymentInboxEvents.findFirst({
        where: eq(paymentInboxEvents.id, providerEventId)
      });
      
      if (!existing) {
         throw new Error("Concurrency error retrieving payment event");
      }

      // Check for abandoned lease or retryable failure
      if (
        (existing.status === 'PROCESSING' && existing.leaseExpiresAt && new Date(existing.leaseExpiresAt) < now) ||
        (existing.status === 'FAILED_RETRYABLE' && existing.nextAttemptAt && new Date(existing.nextAttemptAt) <= now)
      ) {
         // Re-claim lock
         const [reclaimed] = await db.update(paymentInboxEvents).set({
           status: 'PROCESSING',
           claimedAt: now,
           leaseExpiresAt: leaseTime,
           attemptCount: existing.attemptCount + 1
         }).where(
           and(
             eq(paymentInboxEvents.id, existing.id),
             eq(paymentInboxEvents.status, existing.status), // Optimistic concurrency
             existing.leaseExpiresAt 
               ? eq(paymentInboxEvents.leaseExpiresAt, existing.leaseExpiresAt) 
               : lte(paymentInboxEvents.createdAt, now) // If no lease, just pass
           )
         ).returning();
         
         if (!reclaimed) {
            console.info(`[PaymentCoreService] Event ${providerEventId} was claimed by another worker.`);
            return { success: true, message: `Skipped: Claim race lost`, idempotent: true };
         }
         event = reclaimed;
      } else {
         console.info(`[PaymentCoreService] Event ${providerEventId} is ${existing.status}. Skipping.`);
         return { success: true, message: `Skipped: ${existing.status}`, idempotent: true };
      }
    }

    try {
      // 2. Validate Settlement (Provider-specific logic) (H10)
      const settlement = await this.validateSettlement(provider, payload, paymentIntentId, { identity: 'system', capabilities: [] });
      if (!settlement.success) {
        throw new Error(settlement.error || 'Settlement validation failed');
      }

      // 3. Trigger Domain-Specific Fulfillment
      await fulfill(settlement);

      // 4. Mark as Processed
      await db.update(paymentInboxEvents).set({
        status: 'PROCESSED',
        processedAt: new Date()
      }).where(eq(paymentInboxEvents.id, event!.id));

      return { success: true, message: 'Provisioning successful' };
    } catch (error: any) {
      console.error(`[PaymentCoreService] Error processing event ${providerEventId}:`, error);
      // Determine if error is transient (e.g. network timeout) vs permanent (validation)
      const isRetryable = error.message.includes('network') || error.message.includes('timeout') || error.message.includes('ECONNREFUSED');
      
      await db.update(paymentInboxEvents).set({
        status: isRetryable && event!.attemptCount < 3 ? 'FAILED_RETRYABLE' : 'FAILED_FINAL',
        lastError: error.message,
        nextAttemptAt: isRetryable ? new Date(now.getTime() + 15 * 60 * 1000) : null
      }).where(eq(paymentInboxEvents.id, event!.id));
      
      throw error;
    }
  }

  /**
   * Validates if the payment actually settled successfully. (H10)
   */
  private static async validateSettlement(provider: string, payload: any, paymentIntentId: string | null, authContext: { identity: string, capabilities: string[] }) {
    if (provider === 'STRIPE' && payload.type === 'checkout.session.completed') {
      return {
        success: true,
        metadata: payload.data?.object?.metadata
      };
    }
    
    if (provider === 'THIRDWEB') {
      const eventName = payload.eventName || payload.event || payload.logs?.[0]?.eventName;
      if (eventName !== 'Transfer') {
        return { success: false, error: 'Not a Transfer event' };
      }

      // H10: Strict correlation check
      if (!paymentIntentId) {
        return { success: false, error: 'Payment Intent ID is missing for settlement' };
      }

      // H3: Real settlement verification hard-fail
      const toAddress = (payload.toAddress || payload.logs?.[0]?.args?.to)?.toLowerCase();
      const expectedTreasury = (process.env.PANDORAS_TREASURY_ADDRESS || '').toLowerCase();
      
      if (!expectedTreasury) {
        throw new Error('CRITICAL CONFIGURATION ERROR: PANDORAS_TREASURY_ADDRESS is not set. Settlement verification cannot proceed.');
      } 
      
      if (toAddress !== expectedTreasury) {
        return { success: false, error: `Transfer not to authorized treasury (${toAddress} != ${expectedTreasury})` };
      }

      // Verify token contract if expected is set
      const contractAddress = (payload.contractAddress || payload.logs?.[0]?.address)?.toLowerCase();
      const expectedToken = (process.env.EXPECTED_USDC_CONTRACT || '').toLowerCase();
      if (expectedToken) {
         if (!contractAddress || contractAddress !== expectedToken) {
            return { success: false, error: `CRITICAL SETTLEMENT ERROR: Token contract mismatch (${contractAddress} != ${expectedToken})` };
         }
      } else {
         return { success: false, error: `CRITICAL SETTLEMENT ERROR: EXPECTED_USDC_CONTRACT not set` };
      }

      // Enforce chainId if expected
      const expectedChainId = process.env.EXPECTED_CHAIN_ID;
      const chainId = payload.chainId || payload.logs?.[0]?.chainId || payload.transaction?.chainId;
      if (expectedChainId) {
         if (!chainId || chainId.toString() !== expectedChainId.toString()) {
             return { success: false, error: `CRITICAL SETTLEMENT ERROR: Chain ID mismatch (${chainId} != ${expectedChainId})` };
         }
      } else {
          return { success: false, error: `CRITICAL SETTLEMENT ERROR: EXPECTED_CHAIN_ID not set` };
      }

      // Enforce txHash exists
      const txHash = payload.transactionHash?.toLowerCase() || payload.transaction?.hash?.toLowerCase();
      if (!txHash) {
         return { success: false, error: 'Transaction hash missing from provider payload' };
      }

      // Amount > 0
      const value = payload.value || payload.logs?.[0]?.args?.value || payload.amount || "0";
      if (Number(value) <= 0) {
         return { success: false, error: 'Transfer amount is zero or negative' };
      }

      return {
        success: true,
        metadata: payload.metadata
      };
    }

    if (provider === 'EXECUTIVE') {
      // Manual approval requires explicit capability
      if (!authContext.capabilities.includes('SUPER_ADMIN') && !authContext.capabilities.includes('ADMIN')) {
          return { success: false, error: 'EXECUTIVE provider requires ADMIN capability' };
      }

      return {
        success: true,
        metadata: payload.metadata
      };
    }

    return { success: false, error: 'Invalid or unsupported payment status' };
  }

  /**
   * Real snapshot for the Overview "Hermes Omnipresente" widget.
   * Counts inbox buckets + latest events, all scoped to a tenant's org.
   */
  static async vigilanceSnapshot(organizationId: string): Promise<{
    pending: number;
    processedToday: number;
    failed: number;
    lastEvents: { id: string; description: string; timestamp: string; actor: string }[];
  }> {
    try {
      const rows = await db
        .select({
          id: paymentInboxEvents.id,
          status: paymentInboxEvents.status,
          processedAt: paymentInboxEvents.processedAt,
          payload: paymentInboxEvents.payload,
        })
        .from(paymentInboxEvents)
        .where(sql`payload->>'organizationId' = ${organizationId}`)
        .orderBy(desc(paymentInboxEvents.processedAt))
        .limit(50);

      const today = new Date().toISOString().slice(0, 10);
      return {
        pending: rows.filter(r => r.status === 'RECEIVED' || r.status === 'PROCESSING' || r.status === 'pending').length,
        processedToday: rows.filter(r => (r.status === 'PROCESSED' || r.status === 'processed') && r.processedAt && r.processedAt.toISOString().slice(0, 10) === today).length,
        failed: rows.filter(r => r.status === 'FAILED_FINAL' || r.status === 'FAILED_RETRYABLE' || r.status === 'failed').length,
        lastEvents: rows.slice(0, 5).map(r => ({
          id: r.id,
          description: `Evento de pago ${r.status}: ${(r.payload as any)?.title || r.id}`,
          timestamp: r.processedAt?.toISOString() || new Date().toISOString(),
          actor: 'Hermes Payment Core',
        })),
      };
    } catch (err: any) {
      console.warn('[PaymentCoreService] vigilanceSnapshot fallback:', err?.message);
      return { pending: 0, processedToday: 0, failed: 0, lastEvents: [] };
    }
  }
}
