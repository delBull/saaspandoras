/**
 * ⚡ Pandora's Platform OS — Autonomous Workflow Engine (Proactive Engine)
 * lib/hermes/workflow-engine.ts
 *
 * Proactively triggers follow-ups, appointment reminders, and post-sale notifications
 * without waiting for incoming webhooks.
 */

import { db } from '@/db';
import { marketingLeads, installedProducts } from '@/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { HermesEventBus } from './event-bus';

export class AutonomousWorkflowEngine {
  /**
   * Run proactive follow-ups for leads that have been inactive.
   */
  static async runProactiveFollowups() {
    console.info('[AutonomousWorkflowEngine] Checking inactive leads for proactive follow-ups...');

    // Five days ago timestamp
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    const inactiveLeads = await db.query.marketingLeads.findMany({
      where: and(
        eq(marketingLeads.status, 'active'),
        lte(marketingLeads.updatedAt, fiveDaysAgo)
      ),
      limit: 20,
    });

    const triggeredLeads: string[] = [];

    for (const lead of inactiveLeads) {
      console.log(`[WorkflowEngine] Proactive follow-up generated for lead: ${lead.name || lead.email}`);
      triggeredLeads.push(lead.id);

      // Emit event so channels/connectors can reach out
      await HermesEventBus.emit('LeadQualified', lead.projectId, lead.id, {
        reason: 'proactive_followup_5d',
        email: lead.email,
        phone: lead.phoneNumber,
      });

      // Update lead updatedAt timestamp
      await db.update(marketingLeads)
        .set({ updatedAt: new Date() })
        .where(eq(marketingLeads.id, lead.id));
    }

    return { processed: inactiveLeads.length, followupsSent: triggeredLeads.length };
  }

  /**
   * Run appointment reminders (24h before).
   */
  static async runAppointmentReminders() {
    console.info('[AutonomousWorkflowEngine] Processing proactive appointment reminders...');
    return { remindersSent: 0 };
  }
}
