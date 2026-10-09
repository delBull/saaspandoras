import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { meetings, meetingParticipants, channelIdentityBindings } from '@saasfly/db/schema';
import { eq, and, sql } from '@saasfly/db-core';
import { WhatsAppAdapter, TelegramAdapter } from '@saasfly/hermes-core';

/**
 * 🏛️ ARCHITECTURE NOTE: Sovereign Agenda Core (Hermes Orchestration)
 * ===================================================================
 * This CRON acts as the Orchestrator for post-meeting follow-ups.
 * In the decoupled architecture, the Cron is just a trigger, not an authority.
 * 
 * Future Integration Checklist (Academy & other Tenants):
 * - [ ] Event-Driven vs Cron: Consider migrating from a Cron to an Event Bus (e.g. `MeetingEndedEvent`) so Academy can react instantly instead of polling.
 * - [ ] Policy Engine: Academy will have different follow-up rules (e.g. sending homework vs sending a sales pitch). The logic building `messageContent` should be delegated to a Tenant-specific Policy Resolver, not hardcoded here.
 * - [ ] Idempotency: Relying on `followUpStatus = 'sent'` works, but for complex workflows, use an Idempotency Key table to prevent duplicate side-effects (e.g. multiple emails).
 * - [ ] Authority Limits: Ensure that this orchestrator only sends messages via Hermes to participants who have explicitly granted consent/bindings in the specific tenant (currently using `channelIdentityBindings` correctly).
 */

export async function GET(req: NextRequest) {
  // 1. Authenticate Cron Caller via CRON_SECRET
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('[Sovereign Agenda] Starting Follow-Up Cron');

  try {
    // We look for meetings that are "ended" or "completed" where we haven't followed up yet.
    // Wait, meetingStatusEnum has "scheduled", "in_progress", "ended", "cancelled".
    const targetMeetings = await db
      .select()
      .from(meetings)
      .where(eq(meetings.status, 'ended'));

    if (targetMeetings.length === 0) {
      console.log('[Sovereign Agenda] No ended meetings found for follow-up.');
      return NextResponse.json({ success: true, processed: 0 });
    }

    const whatsappAdapter = new WhatsAppAdapter();
    const telegramAdapter = new TelegramAdapter();
    let processed = 0;

    for (const meeting of targetMeetings) {
      // Find participants with pending followUpStatus
      const pendingParticipants = await db
        .select()
        .from(meetingParticipants)
        .where(
          and(
            eq(meetingParticipants.meetingId, meeting.id),
            eq(meetingParticipants.followUpStatus, 'pending')
          )
        );

      if (pendingParticipants.length === 0) continue;

      for (const participant of pendingParticipants) {
        if (!participant.identityId) {
          // If anonymous, just mark as no_action since we don't have an ID
          await db
            .update(meetingParticipants)
            .set({ followUpStatus: 'no_action' })
            .where(eq(meetingParticipants.id, participant.id));
          continue;
        }

        // Try to find channel bindings (WhatsApp / Telegram) for this participant
        const bindings = await db
          .select()
          .from(channelIdentityBindings)
          .where(
            and(
              eq(channelIdentityBindings.identityId, participant.identityId),
              eq(channelIdentityBindings.status, 'ACTIVE')
            )
          );

        const waBinding = bindings.find((b: any) => b.channel === 'whatsapp');
        const tgBinding = bindings.find((b: any) => b.channel === 'telegram');

        const messageContent = `🤖 *Hermes (Agenda Soberana)*\n\nHola, gracias por participar en nuestra Sovereign Meet. Esperamos que la presentación haya sido de valor. Quedamos atentos para cualquier siguiente paso.`;

        let sent = false;

        if (waBinding) {
          try {
            await whatsappAdapter.send({
              organizationId: meeting.canonicalOrgId || 'default',
              conversationId: `conv_wa_${meeting.canonicalOrgId}_${waBinding.externalUserId}`,
              content: messageContent,
              message: { messageId: `fw_${Date.now()}`, content: messageContent, externalMessageId: '' }
            } as any);
            sent = true;
          } catch (err) {
            console.error(`[Sovereign Agenda] WhatsApp failed for ${participant.identityId}`);
          }
        }

        if (!sent && tgBinding) {
          try {
            await telegramAdapter.send({
              organizationId: meeting.canonicalOrgId || 'default',
              conversationId: `conv_tg_${meeting.canonicalOrgId}_${tgBinding.externalUserId}`,
              content: messageContent,
              message: { messageId: `fw_${Date.now()}`, content: messageContent, externalMessageId: '' }
            } as any);
            sent = true;
          } catch (err) {
            console.error(`[Sovereign Agenda] Telegram failed for ${participant.identityId}`);
          }
        }

        // Mark as sent or no_action if we didn't have any channels
        await db
          .update(meetingParticipants)
          .set({ followUpStatus: sent ? 'sent' : 'no_action' })
          .where(eq(meetingParticipants.id, participant.id));

        if (sent) processed++;
      }
    }

    console.log(`[Sovereign Agenda] Follow-up complete. Sent: ${processed}`);
    return NextResponse.json({ success: true, processed });

  } catch (error) {
    console.error('[Sovereign Agenda] Cron Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
