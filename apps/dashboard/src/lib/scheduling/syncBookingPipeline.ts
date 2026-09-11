/**
 * 🔄 SYNC BOOKING TO PIPELINE
 * src/lib/scheduling/syncBookingPipeline.ts
 *
 * Canonical unified pipeline synchronization for Pandora's Sovereign Agenda.
 * Used by both Server Actions (bookSlot) and REST API (POST /api/v1/scheduling/book).
 *
 * Guarantees:
 * 1. Single source of truth (zero duplicate logic).
 * 2. Idempotent scoring (+50 score only if not already scheduled).
 * 3. Client CRM integration with lastBooking metadata.
 * 4. Multi-channel notifications:
 *    - Branded Email (Tenant identity + subtle Pandora's footer, OR 100% Pandoras) with .ics invite.
 *    - WhatsApp / SMS dispatch if preferred.
 *    - Telegram alert with strict tenant vs pandoras separation (and Founder vs Ops role separation).
 *    - Discord Webhook integration.
 */

import { db } from '@/db';
import { marketingLeads, clients, projects } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { sendBookingConfirmedEmail } from '@/lib/email/scheduler-mailer';
import { sendSchedulerTelegramAlert } from '@/lib/scheduling/scheduler-telegram-notifier';
import { sendSchedulerNotification } from '@/lib/discord/scheduler-notifier';
import { SignalWireService } from '@/lib/integrations/signalwire-service';

export interface SyncBookingPipelineParams {
  bookingId: string;
  slotStartTime: Date;
  slotEndTime: Date;
  leadData: {
    name: string;
    email: string;
    phone?: string;
    preference?: 'email' | 'whatsapp' | 'both';
    notes?: string;
    fingerprint?: string;
  };
  meetingLink?: string;
  projectId?: number;
  tenantSlug?: string;
  hostUserId?: string;
  hostRole?: 'FOUNDER' | 'OPERATIONS' | 'MEMBER';
}

export async function syncBookingToPipeline(params: SyncBookingPipelineParams) {
  const {
    bookingId,
    slotStartTime,
    slotEndTime,
    leadData,
    meetingLink = 'https://meet.google.com/pdr-sovereign-call',
    projectId,
    tenantSlug,
    hostUserId,
    hostRole,
  } = params;

  const normalizedEmail = leadData.email.toLowerCase().trim();
  const now = new Date();

  // 1. Resolve Project for Tenant Awareness
  let targetProject: any = null;
  try {
    if (projectId) {
      targetProject = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });
    } else if (tenantSlug) {
      targetProject = await db.query.projects.findFirst({
        where: eq(projects.slug, tenantSlug),
      });
    }

    // Default to pandoras project if not found or empty
    if (!targetProject) {
      targetProject = await db.query.projects.findFirst({
        where: eq(projects.slug, 'pandoras'),
      });
    }
  } catch (err) {
    console.warn('[SyncBookingPipeline] Project resolution warning:', err);
  }

  const effectiveProjectId = targetProject?.id || 1;
  const isPandoras =
    !targetProject ||
    targetProject.slug === 'pandoras' ||
    targetProject.slug === 'saaspandoras' ||
    tenantSlug === 'pandoras';

  const brandName = isPandoras ? "Pandora's" : (targetProject?.title || tenantSlug || 'Tenant');

  // 2. Marketing Lead Upsert with Idempotent Scoring (+50)
  try {
    const { IdentityService } = await import('@/lib/marketing/identity-service');
    const identityHash = IdentityService.getIdentityHash(normalizedEmail, null, leadData.fingerprint);

    await db
      .insert(marketingLeads)
      .values({
        projectId: effectiveProjectId,
        email: normalizedEmail,
        name: leadData.name,
        phoneNumber: leadData.phone || null,
        status: 'scheduled',
        intent: 'other',
        quality: 'high',
        score: 50,
        scope: 'b2b',
        fingerprint: leadData.fingerprint || null,
        identityHash: identityHash as string,
      })
      .onConflictDoUpdate({
        target: [marketingLeads.projectId, marketingLeads.identityHash],
        set: {
          status: 'scheduled',
          quality: 'high',
          score: sql`
            CASE 
              WHEN ${marketingLeads.status} != 'scheduled' 
              THEN ${marketingLeads.score} + 50 
              ELSE ${marketingLeads.score} 
            END`,
          updatedAt: new Date(),
          name: leadData.name,
          phoneNumber: leadData.phone || null,
        },
      });
  } catch (leadErr) {
    console.error('[SyncBookingPipeline] Marketing lead sync error (non-blocking):', leadErr);
  }

  // 3. Sync to CRM (Clients)
  try {
    await db
      .insert(clients)
      .values({
        email: normalizedEmail,
        name: leadData.name,
        whatsapp: leadData.phone || null,
        status: 'negotiating',
        source: 'scheduling',
        metadata: {
          bookingId,
          bookedAt: now.toISOString(),
          tenantSlug: targetProject?.slug || tenantSlug || 'pandoras',
          notes: leadData.notes,
        },
      })
      .onConflictDoUpdate({
        target: [clients.email],
        set: {
          status: 'negotiating',
          name: leadData.name,
          whatsapp: leadData.phone || null,
          metadata: sql`jsonb_set(
            COALESCE(${clients.metadata}, '{}'::jsonb), 
            '{lastBooking}', 
            ${JSON.stringify({
              bookingId,
              bookedAt: now.toISOString(),
              tenantSlug: targetProject?.slug || tenantSlug || 'pandoras',
            })}::jsonb
          )`,
        },
      });
  } catch (crmErr) {
    console.error('[SyncBookingPipeline] CRM clients sync error (non-blocking):', crmErr);
  }

  // 4. Multi-Channel Notifications Dispatch
  const notificationTasks: Promise<any>[] = [];

  // 4.1 Email with Brand Identity & .ics attachment
  notificationTasks.push(
    sendBookingConfirmedEmail(normalizedEmail, {
      name: leadData.name,
      start: slotStartTime,
      end: slotEndTime,
      meetingLink,
      brand: {
        name: brandName,
        isPandoras,
        logoUrl: targetProject?.logoUrl || undefined,
      },
    }).catch((err) => console.error('[SyncBookingPipeline] Email confirmation error:', err))
  );

  // 4.2 Telegram Notification (Strict Tenant vs Pandoras & Role Separation)
  notificationTasks.push(
    sendSchedulerTelegramAlert({
      bookingId,
      startTime: slotStartTime,
      lead: {
        name: leadData.name,
        email: normalizedEmail,
        phone: leadData.phone,
        notes: leadData.notes,
      },
      meetingLink,
      tenantSlug: targetProject?.slug || tenantSlug,
      project: targetProject,
      hostUserId,
      hostRole,
    }).catch((err) => console.error('[SyncBookingPipeline] Telegram notification error:', err))
  );

  // 4.3 Discord Webhook
  const projectWebhookUrl = targetProject?.discordWebhookUrl || null;
  notificationTasks.push(
    sendSchedulerNotification(
      bookingId,
      slotStartTime,
      {
        name: leadData.name,
        email: normalizedEmail,
        notes: leadData.notes,
        phone: leadData.phone,
        projectTitle: brandName,
      },
      false, // already confirmed
      projectWebhookUrl
    ).catch((err) => console.error('[SyncBookingPipeline] Discord notification error:', err))
  );

  // 4.4 WhatsApp / SMS Dispatch if requested
  const preference = leadData.preference || 'email';
  if ((preference === 'whatsapp' || preference === 'both') && leadData.phone) {
    const formattedPhone = leadData.phone.replace(/[^+\d]/g, '');
    const dateReadable = slotStartTime.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const timeReadable = slotStartTime.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const smsText = isPandoras
      ? `Hola ${leadData.name}, tu sesión con Pandora's está confirmada para el ${dateReadable} a las ${timeReadable}. Acceso: ${meetingLink}`
      : `Hola ${leadData.name}, tu sesión con ${brandName} está confirmada para el ${dateReadable} a las ${timeReadable}. Acceso: ${meetingLink}`;

    notificationTasks.push(
      SignalWireService.sendSMS({
        to: formattedPhone,
        body: smsText,
      }).catch((err) => console.error('[SyncBookingPipeline] SMS/WhatsApp dispatch error:', err))
    );
  }

  // Execute non-blocking notification dispatches
  await Promise.allSettled(notificationTasks);

  return {
    success: true,
    bookingId,
    projectId: effectiveProjectId,
    brandName,
  };
}
