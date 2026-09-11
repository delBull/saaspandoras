import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { schedulingBookings, schedulingSlots, clients, projects } from '@/db/schema';
import { eq, and, gte, lte, or, sql } from 'drizzle-orm';
import { sendBookingReminderEmail } from '@/lib/email/scheduler-mailer';
import { SignalWireService } from '@/lib/integrations/signalwire-service';

export async function GET(req: NextRequest) {
  // 1. Authenticate Cron Caller via CRON_SECRET
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();

    // Window T-24h: between 23h and 25h in the future
    const start24h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const end24h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Window T-1h: between 45m and 75m in the future
    const start1h = new Date(now.getTime() + 45 * 60 * 1000);
    const end1h = new Date(now.getTime() + 75 * 60 * 1000);

    // Query active confirmed bookings in either window
    const upcomingBookings = await db
      .select({
        booking: schedulingBookings,
        slot: schedulingSlots,
      })
      .from(schedulingBookings)
      .innerJoin(schedulingSlots, eq(schedulingBookings.slotId, schedulingSlots.id))
      .where(
        and(
          eq(schedulingBookings.status, 'confirmed'),
          or(
            and(gte(schedulingSlots.startTime, start24h), lte(schedulingSlots.startTime, end24h)),
            and(gte(schedulingSlots.startTime, start1h), lte(schedulingSlots.startTime, end1h))
          )
        )
      );

    let processed24h = 0;
    let processed1h = 0;

    for (const item of upcomingBookings) {
      const { booking, slot } = item;
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);
      const notes = booking.notes || '';

      const is24hWindow = startTime >= start24h && startTime <= end24h;
      const is1hWindow = startTime >= start1h && startTime <= end1h;

      // Check idempotent reminder flags
      const alreadySent24h = notes.includes('[reminder_24h_sent]');
      const alreadySent1h = notes.includes('[reminder_1h_sent]');

      let reminderWindow: '24h' | '1h' | null = null;
      let reminderTag = '';

      if (is24hWindow && !alreadySent24h) {
        reminderWindow = '24h';
        reminderTag = '[reminder_24h_sent]';
      } else if (is1hWindow && !alreadySent1h) {
        reminderWindow = '1h';
        reminderTag = '[reminder_1h_sent]';
      }

      if (!reminderWindow) {
        continue;
      }

      // Resolve tenant project if applicable from CRM metadata or default
      let brandName = "Pandora's";
      let isPandoras = true;
      let logoUrl: string | undefined = undefined;

      try {
        const clientRecord = await db.query.clients.findFirst({
          where: eq(clients.email, booking.leadEmail.toLowerCase().trim()),
        });
        const clientMetadata = (clientRecord?.metadata as any) || {};
        const tenantSlug = clientMetadata?.lastBooking?.tenantSlug;

        if (tenantSlug && tenantSlug !== 'pandoras' && tenantSlug !== 'saaspandoras') {
          const tenantProject = await db.query.projects.findFirst({
            where: eq(projects.slug, tenantSlug),
          });
          if (tenantProject) {
            brandName = tenantProject.title;
            isPandoras = false;
            logoUrl = tenantProject.logoUrl || undefined;
          }
        }
      } catch (clientErr) {
        console.warn('[SchedulingReminders] Error resolving brand identity:', clientErr);
      }

      // 1. Send Email Reminder
      try {
        await sendBookingReminderEmail(booking.leadEmail, {
          name: booking.leadName,
          start: startTime,
          end: endTime,
          meetingLink: booking.meetingLink || undefined,
          window: reminderWindow,
          brand: {
            name: brandName,
            isPandoras,
            logoUrl,
          },
        });
      } catch (emailErr) {
        console.error(`[SchedulingReminders] Failed to send email reminder for ${booking.id}:`, emailErr);
      }

      // 2. Send WhatsApp/SMS Reminder if preferred
      if (
        (booking.notificationPreference === 'whatsapp' || booking.notificationPreference === 'both') &&
        booking.leadPhone
      ) {
        try {
          const formattedPhone = booking.leadPhone.replace(/[^+\d]/g, '');
          const timeStr = startTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
          const windowText = reminderWindow === '24h' ? 'mañana' : 'en 1 hora';
          const link = booking.meetingLink || 'https://meet.google.com/pdr-sovereign-call';

          const smsText = isPandoras
            ? `⏰ Recordatorio Pandora's: Tu sesión comienza ${windowText} (${timeStr}). Enlace: ${link}`
            : `⏰ Recordatorio ${brandName}: Tu sesión comienza ${windowText} (${timeStr}). Enlace: ${link}`;

          await SignalWireService.sendSMS({
            to: formattedPhone,
            body: smsText,
          });
        } catch (smsErr) {
          console.error(`[SchedulingReminders] Failed to send SMS reminder for ${booking.id}:`, smsErr);
        }
      }

      // 3. Mark reminder as sent atomically in booking notes and client metadata
      const updatedNotes = notes ? `${notes} ${reminderTag}` : reminderTag;
      await db
        .update(schedulingBookings)
        .set({
          notes: updatedNotes,
          updatedAt: new Date(),
        })
        .where(eq(schedulingBookings.id, booking.id));

      if (reminderWindow === '24h') processed24h++;
      if (reminderWindow === '1h') processed1h++;
    }

    return NextResponse.json({
      ok: true,
      processed24h,
      processed1h,
      totalUpcomingChecked: upcomingBookings.length,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('[SchedulingReminders] Critical Cron Error:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
