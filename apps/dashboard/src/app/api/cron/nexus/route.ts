import { NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { nexusDealRooms, nexusDealSigners, nexusDealAuditEvents } from '@saasfly/db/schema';
import { eq, inArray, and } from "@saasfly/db-core";
import {
  sendEmail,
  renderEmailAsync,
  resolveEmailBranding,
  NexusDealEmailTemplate,
} from '@saasfly/shared';

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

    const processingPromises = pendingRooms.map(async (room) => {
      if (room.signers.length === 0) return 0;

      const reminderEvents = room.audit;
      const reminderCount = reminderEvents.length;

      // Limit max 3 reminders
      if (reminderCount >= 3) return 0;

      const lastReminderDate = reminderCount > 0 && reminderEvents[0]?.at
        ? new Date(reminderEvents[0].at) 
        : new Date(room.createdAt);

      const timeSinceLast = now.getTime() - lastReminderDate.getTime();

      // If more than 3 days have passed
      if (timeSinceLast >= THREE_DAYS_MS) {
        const roomTitle = room.company || room.counterparty;
        const branding = await resolveEmailBranding({
          explicitBrand: {
            name: "Pandoras Nexus",
            accentColor: "#f59e0b",
            isPandorasPlatform: true,
          },
        });

        // Send email to all pending signers concurrently
        const emailPromises = room.signers
          .filter(signer => signer.email)
          .map(async (signer) => {
            const roomUrl = `https://dash.pandoras.finance/nexus/deals/${room.publicId}`;
            const rendered = await renderEmailAsync({
              template: NexusDealEmailTemplate,
              props: {
                branding,
                dealKindLabel: "Propuesta de Acuerdo",
                counterparty: roomTitle,
                recipientName: signer.signatureName || signer.email,
                type: "reminder",
                actionUrl: roomUrl,
                actionText: "Abrir Propuesta en Nexus →",
                noticeText: "Te recordamos que esta propuesta sigue pendiente de revisión y firma en el Deal Room. Si tienes dudas o ajustes, puedes dejar comentarios directamente en el documento.",
              },
            });

            return sendEmail({
              from: 'Pandoras Nexus <nexus@pandoras.finance>',
              to: [signer.email!],
              subject: `Recordatorio: Propuesta pendiente de revisión - ${roomTitle}`,
              html: rendered.html,
              text: rendered.text,
            });
          });

        await Promise.all(emailPromises);

        // Log audit event
        await db.insert(nexusDealAuditEvents).values({
          roomId: room.id,
          actor: 'System Cron',
          action: 'REMINDER_SENT',
          detail: `Reminder ${reminderCount + 1}/3 sent to pending signers.`,
        });

        return 1;
      }
      return 0;
    });

    const results = await Promise.all(processingPromises);
    remindersSent = results.reduce((acc, val) => acc + val, 0 as number);

    return NextResponse.json({ success: true, remindersSent });
  } catch (error) {
    console.error('Error running nexus deal cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
