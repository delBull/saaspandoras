/**
 * 📈 HERMES TRIAL TIMELINE & PRODUCT DISCOVERY SERVICE (GATE 8)
 * src/lib/hermes/trial/hermes-trial-timeline.service.ts
 *
 * Records user milestone events on trial tenants to power product discovery,
 * funnel conversion analysis, and operational auditing from Day 1.
 */

import { db } from '@/db';
import { hermesTrialEvents } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';

export type TrialTimelineEventType =
  | 'TRIAL_STARTED'
  | 'KNOWLEDGE_ADDED'
  | 'IDENTITY_COMPLETED'
  | 'OBJECTIVE_CREATED'
  | 'STRATEGY_REQUESTED'
  | 'CAMPAIGN_CREATED'
  | 'CONTENT_REVIEWED'
  | 'CHANNEL_CONNECTED'
  | 'MEDIA_GENERATED'
  | 'DISTRIBUTION_EXECUTED'
  | 'TRIAL_EXPIRED'
  | 'TRIAL_CANCELLED'
  | 'UPGRADE_STARTED';

export interface TrialTimelineEvent {
  id: string;
  tenantId: string;
  eventType: TrialTimelineEventType;
  actorId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export class HermesTrialTimelineService {
  private static inMemoryEvents: TrialTimelineEvent[] = [];

  /**
   * Clears in-memory events for testing.
   */
  public static clearForTesting(): void {
    this.inMemoryEvents = [];
  }

  /**
   * Records a milestone event in the trial timeline.
   */
  public static async recordEvent(
    tenantId: string,
    eventType: TrialTimelineEventType,
    options: {
      actorId?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<TrialTimelineEvent> {
    const normalizedTenant = tenantId.toLowerCase().trim();
    const eventId = `tevt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const createdAt = new Date();

    const eventRecord: TrialTimelineEvent = {
      id: eventId,
      tenantId: normalizedTenant,
      eventType,
      actorId: options.actorId || 'system',
      metadata: options.metadata || {},
      createdAt,
    };

    this.inMemoryEvents.push(eventRecord);

    if (db) {
      try {
        await db.insert(hermesTrialEvents).values({
          id: eventId,
          tenantId: normalizedTenant,
          eventType,
          actorId: options.actorId || 'system',
          metadataJson: options.metadata || {},
          createdAt,
        });
      } catch (err) {
        console.warn(`[HermesTrialTimeline] Notice persisting event ${eventType} for ${normalizedTenant}:`, err);
      }
    }

    return eventRecord;
  }

  /**
   * Retrieves the full timeline of events for a trial tenant.
   */
  public static async getTenantTimeline(tenantId: string): Promise<TrialTimelineEvent[]> {
    const normalizedTenant = tenantId.toLowerCase().trim();

    if (db) {
      try {
        const rows = await db
          .select()
          .from(hermesTrialEvents)
          .where(eq(hermesTrialEvents.tenantId, normalizedTenant))
          .orderBy(desc(hermesTrialEvents.createdAt))
          .limit(100);

        if (rows.length > 0) {
          return rows.map(r => ({
            id: r.id,
            tenantId: r.tenantId,
            eventType: r.eventType as TrialTimelineEventType,
            actorId: r.actorId || undefined,
            metadata: (r.metadataJson as Record<string, any>) || {},
            createdAt: r.createdAt,
          }));
        }
      } catch (err) {
        console.warn(`[HermesTrialTimeline] Notice querying timeline for ${normalizedTenant}:`, err);
      }
    }

    return this.inMemoryEvents
      .filter(e => e.tenantId === normalizedTenant)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
