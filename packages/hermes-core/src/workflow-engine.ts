/**
 * ⚡ Pandora's Platform OS — Autonomous Workflow Engine (Proactive Engine)
 * lib/hermes/workflow-engine.ts
 *
 * Proactively triggers follow-ups, appointment reminders, and post-sale notifications
 * without waiting for incoming webhooks.
 */

import { db } from '@saasfly/db-core';
import { marketingLeads, installedProducts, schedulingBookings, schedulingSlots } from '@saasfly/db-core/schema';
import { eq, and, lte, gte } from "@saasfly/db-core";
import { HermesEventBus } from './event-bus';
import { sendEmail } from '@saasfly/shared';

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

    let followupsSent = 0;

    for (const lead of inactiveLeads) {
      console.log(`[WorkflowEngine] Proactive follow-up generated for lead: ${lead.name || lead.email}`);

      try {
        // Emit event so channels/connectors can reach out
        await HermesEventBus.emit('LeadQualified', lead.projectId, lead.id, {
          reason: 'proactive_followup_5d',
          email: lead.email,
          phone: lead.phoneNumber,
          name: lead.name,
        });

        // Update lead updatedAt timestamp
        await db.update(marketingLeads)
          .set({ updatedAt: new Date() })
          .where(eq(marketingLeads.id, lead.id));

        followupsSent++;
      } catch (err) {
        console.error(`[WorkflowEngine] Failed follow-up emit for lead ${lead.id}:`, err);
      }
    }

    return { processed: inactiveLeads.length, followupsSent };
  }

  /**
   * Run appointment reminders (24h before).
   */
  static async runAppointmentReminders() {
    console.info('[AutonomousWorkflowEngine] Processing proactive appointment reminders...');
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    let remindersSent = 0;

    try {
      // Find confirmed bookings within 24-25h window
      const upcomingBookings = await db
        .select({
          bookingId: schedulingBookings.id,
          leadName: schedulingBookings.leadName,
          leadEmail: schedulingBookings.leadEmail,
          meetingLink: schedulingBookings.meetingLink,
          notes: schedulingBookings.notes,
          slotStartTime: schedulingSlots.startTime,
        })
        .from(schedulingBookings)
        .innerJoin(schedulingSlots, eq(schedulingBookings.slotId, schedulingSlots.id))
        .where(
          and(
            eq(schedulingBookings.status, 'confirmed'),
            gte(schedulingSlots.startTime, in24Hours),
            lte(schedulingSlots.startTime, in25Hours)
          )
        );

      for (const booking of upcomingBookings) {
        if (!booking.leadEmail) continue;

        try {
          await sendEmail({
            from: 'Pandoras Nexus <agenda@pandoras.finance>',
            to: [booking.leadEmail],
            subject: 'Recordatorio: Tu sesión estratégica es mañana',
            text: `Hola ${booking.leadName},\n\nTe recordamos que tienes una reunión programada para mañana a las ${booking.slotStartTime?.toLocaleTimeString()}.\nEnlace de la sesión: ${booking.meetingLink || 'Disponible en tu portal'}\n\nNos vemos pronto,\nEquipo Pandoras`,
            html: `<p>Hola <strong>${booking.leadName}</strong>,</p><p>Te recordamos que tienes una reunión programada para mañana a las <strong>${booking.slotStartTime?.toLocaleTimeString()}</strong>.</p><p>Enlace de la sesión: <a href="${booking.meetingLink || '#'}">${booking.meetingLink || 'Disponible en tu portal'}</a></p><p>Nos vemos pronto,<br/>Equipo Pandoras</p>`,
          });
          remindersSent++;
        } catch (mailErr) {
          console.error(`[WorkflowEngine] Failed to send reminder to ${booking.leadEmail}:`, mailErr);
        }
      }

      return { remindersSent, checked: upcomingBookings.length };
    } catch (err: any) {
      console.error('[WorkflowEngine] Error querying upcoming bookings:', err?.message || err);
      return { remindersSent: 0, checked: 0, error: err?.message };
    }
  }
}

