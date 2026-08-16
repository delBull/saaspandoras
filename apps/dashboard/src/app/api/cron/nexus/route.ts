import { NextResponse } from 'next/server';
import { db } from '@/db';
import { nexusDealRooms, nexusDealSigners, nexusDealAuditEvents } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { resend } from '@/lib/resend';

import NexusDealReminder from '@/emails/NexusDealReminder';

export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify cron secret if needed (often passed in headers by Vercel)
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 1. Fetch active Deal Rooms that haven't been signed yet
    const pendingRooms = await db.query.nexusDealRooms.findMany({
      where: inArray(nexusDealRooms.status, ['DRAFT', 'PROPOSAL_SENT', 'REVIEW']),
      with: {
        signers: {
          where: eq(nexusDealSigners.status, 'PENDING')
        },
        audit: {
          where: eq(nexusDealAuditEvents.action, 'REMINDER_SENT'),
          orderBy: (auditEvents, { desc }) => [desc(auditEvents.at)]
        }
      }
    });

    let remindersSent = 0;
    const now = new Date();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

    for (const room of pendingRooms) {
      if (room.signers.length === 0) continue;

      const reminderEvents = room.audit;
      const reminderCount = reminderEvents.length;

      // Limit max 3 reminders
      if (reminderCount >= 3) continue;

      const lastReminderDate = reminderCount > 0 && reminderEvents[0]?.at
        ? new Date(reminderEvents[0].at) 
        : new Date(room.createdAt);

      const timeSinceLast = now.getTime() - lastReminderDate.getTime();

      // If more than 3 days have passed
      if (timeSinceLast >= THREE_DAYS_MS) {
        // Send email to all pending signers
        for (const signer of room.signers) {
          if (signer.email) {
            const roomUrl = `https://dash.pandoras.finance/nexus/deals/${room.publicId}`;
            await resend.emails.send({
              from: 'Pandoras Nexus <nexus@pandoras.finance>',
              to: [signer.email],
              subject: `Recordatorio: Propuesta pendiente de revisión - ${room.company || room.counterparty}`,
              react: NexusDealReminder({
                signerName: signer.signatureName || signer.email,
                roomTitle: room.company || room.counterparty,
                roomUrl,
              }),
            });
          }
        }

        // Log audit event
        await db.insert(nexusDealAuditEvents).values({
          roomId: room.id,
          actor: 'System Cron',
          action: 'REMINDER_SENT',
          detail: `Reminder ${reminderCount + 1}/3 sent to pending signers.`,
        });

        remindersSent++;
      }
    }

    return NextResponse.json({ success: true, remindersSent });
  } catch (error) {
    console.error('Error running nexus deal cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
