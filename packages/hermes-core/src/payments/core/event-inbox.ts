/**
 * ⚡ Hermes Payment Event Inbox — durable idempotency boundary
 * src/lib/@/payments/core/event-inbox.ts
 *
 * Wraps the `payment_inbox_events` table (migration 0074):
 *  - record(): insert-once by providerEventId (onConflictDoNothing) → returns
 *    whether the event was claimed (true) or is a duplicate (false).
 *  - markProcessed / markFailed: lifecycle transitions.
 *  - vigilanceSnapshot(): counts scoped to an organization via payload->
 *    'organizationId' (server-authoritative origin of the inbox event).
 * Used by the "Hermes Omnipresente" widget as a real production stream.
 */

import { db } from "@saasfly/db-core";
import { paymentInboxEvents } from "@saasfly/db-core";
import { eq, sql, desc } from "@saasfly/db-core";

export class HermesPaymentEventInbox {
  /**
   * Durable, idempotent claim of a provider event.
   * Returns true when THIS call claimed the event (first delivery).
   * Returns false when the event is a duplicate (already recorded).
   */
  static async claimEvent(params: {
    providerEventId: string;
    provider: string;
    paymentIntentId?: string | null;
    payload: Record<string, unknown>;
  }): Promise<boolean> {
    const [row] = await db
      .insert(paymentInboxEvents)
      .values({
        id: params.providerEventId,
        provider: params.provider,
        paymentIntentId: params.paymentIntentId ?? null,
        payload: params.payload as any,
        status: 'pending',
      })
      .onConflictDoNothing()
      .returning({ id: paymentInboxEvents.id });
    return Boolean(row);
  }

  static async markProcessed(providerEventId: string): Promise<void> {
    await db.update(paymentInboxEvents)
      .set({ status: 'processed', processedAt: new Date() })
      .where(eq(paymentInboxEvents.id, providerEventId));
  }

  static async markFailed(providerEventId: string, reason: string): Promise<void> {
    await db.update(paymentInboxEvents)
      .set({ status: 'failed', error: reason })
      .where(eq(paymentInboxEvents.id, providerEventId));
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
        pending: rows.filter(r => r.status === 'pending').length,
        processedToday: rows.filter(r => r.status === 'processed' && r.processedAt && r.processedAt.toISOString().slice(0, 10) === today).length,
        failed: rows.filter(r => r.status === 'failed').length,
        lastEvents: rows.slice(0, 5).map(r => ({
          id: r.id,
          description: `Evento de pago ${r.status}: ${(r.payload as any)?.title || r.id}`,
          timestamp: r.processedAt?.toISOString() || new Date().toISOString(),
          actor: 'Hermes Payment Core',
        })),
      };
    } catch (err: any) {
      console.warn('[HermesPaymentEventInbox] vigilanceSnapshot fallback:', err?.message);
      return { pending: 0, processedToday: 0, failed: 0, lastEvents: [] };
    }
  }
}
