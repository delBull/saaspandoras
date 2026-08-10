import { db } from "@/db";
import { outboxEvents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export interface OutboxEvent {
  id: string;
  organizationId: string | null;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: any;
  status: string;
  attempts: number;
  lastError: string | null;
  lockedAt: Date | null;
  lockedBy: string | null;
  createdAt: Date;
  processedAt: Date | null;
}

export class OutboxRepository {
  /**
   * Atomically claims a batch of pending events.
   * Uses FOR UPDATE SKIP LOCKED to prevent concurrent workers from claiming the same rows.
   */
  static async claimEvents(limit: number, workerId: string): Promise<OutboxEvent[]> {
    const query = sql`
      UPDATE outbox_events
      SET status = 'processing', 
          locked_at = NOW(), 
          locked_by = ${workerId}, 
          attempts = attempts + 1
      WHERE id IN (
        SELECT id FROM outbox_events 
        WHERE status = 'pending' 
           OR (status = 'processing' AND locked_at < NOW() - INTERVAL '5 minutes')
        ORDER BY created_at ASC 
        FOR UPDATE SKIP LOCKED 
        LIMIT ${limit}
      )
      RETURNING *;
    `;

    const result = await db.execute(query);
    // Depending on the driver, it might be in result or result.rows
    const rows = Array.isArray(result) ? result : (result as any).rows || [];
    
    // Map to our interface (camelCase vs snake_case conversion may be needed if raw sql is used)
    return rows.map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      eventType: row.event_type,
      payload: row.payload,
      status: row.status,
      attempts: row.attempts,
      lastError: row.last_error,
      lockedAt: row.locked_at,
      lockedBy: row.locked_by,
      createdAt: row.created_at,
      processedAt: row.processed_at,
    }));
  }

  /**
   * Marks an event as successfully processed.
   */
  static async markProcessed(eventId: string) {
    await db.update(outboxEvents)
      .set({
        status: 'processed',
        processedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
      })
      .where(eq(outboxEvents.id, eventId));
  }

  /**
   * Marks an event as failed (or pending if retries remain).
   */
  static async markFailed(eventId: string, error: string, maxRetries: number) {
    // We need to fetch current attempts to decide
    const events = await db.select({ attempts: outboxEvents.attempts }).from(outboxEvents).where(eq(outboxEvents.id, eventId));
    const event = events[0];
    if (!event) return;

    const currentAttempts = event.attempts;
    const newStatus = currentAttempts >= maxRetries ? 'failed' : 'pending';

    await db.update(outboxEvents)
      .set({
        status: newStatus,
        lastError: error,
        lockedAt: null,
        lockedBy: null,
      })
      .where(eq(outboxEvents.id, eventId));
  }
}
