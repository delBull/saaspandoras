import { db } from '@saasfly/db';
import { meetings, meetingParticipants, channelIdentityBindings } from '@saasfly/db/schema';
import { eq, and } from '@saasfly/db-core';
import { WhatsAppAdapter, TelegramAdapter } from '@saasfly/hermes-core';
import { sendEmail } from '@saasfly/shared';
import { findPresentation } from '@/lib/nexus/presentations-catalog';

/**
 * 🏛️ ARCHITECTURE NOTE: Seguimiento post-presentación (una sola implementación)
 * ==========================================================================
 * Único lugar donde se decide y ejecuta el seguimiento de una reunión terminada.
 * Dos disparadores del mismo mecanismo:
 *
 *   1. `POST /api/v1/meet/end` → `runSovereignFollowUps(meetingId)` al cerrar (inmediato).
 *   2. `GET /api/cron/sovereign-agenda-followups` → `runSovereignFollowUps()` (red de seguridad).
 *
 * Idempotente por `meeting_participants.follow_up_status`:
 *   pending → sent (entregado) | pending (intentado y falló, reintentable) | no_action (sin canal)
 *
 * Canal primario: email. Los participantes de una Deal Room se invitan por correo, que
 * vive en `identity_id`; WhatsApp/Telegram solo si no hay email y existe binding activo.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FROM = process.env.RESEND_FROM_EMAIL ?? "Pandora's Group <hello@pandoras.finance>";

export interface FollowUpSummary {
  meetings: number;
  sent: number;
  pending: number;
  noAction: number;
  /** Invitados con link personal que NO entraron (no-show) — solo si la asistencia es conocida */
  noShow: number;
}

function followUpEmailHtml(input: { firstName: string; deckTitle: string | null; deckUrl: string | null }): string {
  const { firstName, deckTitle, deckUrl } = input;
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><title>Gracias por tu tiempo</title></head>
<body style="margin:0;padding:0;background-color:#08080C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;margin:0 auto;background:#0F0F18;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#0a0a1a 0%,#1a0533 100%);padding:28px 32px;text-align:center;">
          <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(251,191,36,0.7);margin-bottom:10px;">PANDORA'S · SOVEREIGN MEET</div>
          <div style="font-size:22px;font-weight:700;color:#ffffff;">Gracias por la sesión</div>
        </td></tr>
        <tr><td style="padding:30px 32px;">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.78);">
            ${firstName ? `Hola ${firstName}` : 'Hola'},<br/><br/>
            Gracias por el tiempo de hoy. Dejamos registrada la sesión y el material presentado.
          </p>
          ${deckUrl && deckTitle ? `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${deckUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:10px;">
              Ver la presentación · ${deckTitle}
            </a></td></tr></table>` : ''}
          <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.6);">
            Cualquier duda o ajuste sobre lo revisado, responde directamente a este correo.
          </p>
        </td></tr>
        <tr><td style="background:#080810;padding:14px 28px;border-top:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:10px;color:rgba(255,255,255,0.28);text-align:center;">Pandora's Group · Confidential</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Procesa el seguimiento de las reuniones terminadas con participantes pendientes.
 * @param meetingId Limita el proceso a una reunión (cierre inmediato). Sin parámetro: todas.
 */
export async function runSovereignFollowUps(meetingId?: string): Promise<FollowUpSummary> {
  const summary: FollowUpSummary = { meetings: 0, sent: 0, pending: 0, noAction: 0, noShow: 0 };

  const targetMeetings = meetingId
    ? await db.select().from(meetings).where(and(eq(meetings.id, meetingId), eq(meetings.status, 'ended')))
    : await db.select().from(meetings).where(eq(meetings.status, 'ended'));

  if (targetMeetings.length === 0) return summary;

  const whatsappAdapter = new WhatsAppAdapter();
  const telegramAdapter = new TelegramAdapter();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NODE_ENV === 'production' ? 'https://dash.pandoras.finance' : 'http://localhost:3000');

  for (const meeting of targetMeetings) {
    const allParticipants = await db
      .select()
      .from(meetingParticipants)
      .where(eq(meetingParticipants.meetingId, meeting.id));

    const pendingParticipants = allParticipants.filter((p) => p.followUpStatus === 'pending');
    if (pendingParticipants.length === 0) continue;
    summary.meetings++;

    // Asistencia: solo se considera CONOCIDA si al menos un invitado con link personal entró.
    // Sin esa evidencia (reuniones sin tokens) el envío sigue siendo a todos: no se inventa no-show.
    const attendanceKnown = allParticipants.some((p) => Boolean(p.joinToken) && Boolean(p.joinedAt));

    const deck = findPresentation(meeting.presentationId);
    const deckUrl = deck ? `${baseUrl}${deck.href}` : null;

    for (const participant of pendingParticipants) {
      // Con asistencia conocida, el seguimiento va a quien realmente asistió.
      // Los no-show se marcan explícitamente (y se cuentan) para el flujo manual.
      if (attendanceKnown && participant.joinToken && !participant.joinedAt) {
        await db
          .update(meetingParticipants)
          .set({ followUpStatus: 'no_action' })
          .where(eq(meetingParticipants.id, participant.id));
        summary.noShow++;
        continue;
      }

      if (!participant.identityId) {
        await db
          .update(meetingParticipants)
          .set({ followUpStatus: 'no_action' })
          .where(eq(meetingParticipants.id, participant.id));
        summary.noAction++;
        continue;
      }

      const identity = participant.identityId.trim();
      let sent = false;
      let attempted = false;

      // 1) EMAIL — canal primario
      if (EMAIL_PATTERN.test(identity)) {
        attempted = true;
        try {
          const result = await sendEmail({
            to: identity,
            from: FROM,
            subject: `Seguimiento de la sesión${deck ? ` · ${deck.title}` : ''}`,
            html: followUpEmailHtml({
              firstName: identity.split('@')[0] ?? '',
              deckTitle: deck?.title ?? null,
              deckUrl,
            }),
          });
          sent = Boolean(result?.success);
          if (!sent) {
            console.error(`[Sovereign FollowUp] Email not sent for ${identity}: ${result?.error ?? 'unknown'}`);
          }
        } catch (err) {
          console.error(`[Sovereign FollowUp] Email failed for ${identity}`, err);
        }
      }

      // 2) WhatsApp / Telegram — solo si no hubo canal email
      if (!attempted) {
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

        if (waBinding) {
          attempted = true;
          try {
            await whatsappAdapter.send({
              organizationId: meeting.canonicalOrgId || 'default',
              conversationId: `conv_wa_${meeting.canonicalOrgId}_${waBinding.externalUserId}`,
              content: messageContent,
              message: { messageId: `fw_${Date.now()}`, content: messageContent, externalMessageId: '' }
            } as any);
            sent = true;
          } catch {
            console.error(`[Sovereign FollowUp] WhatsApp failed for ${participant.identityId}`);
          }
        }

        if (!sent && tgBinding) {
          attempted = true;
          try {
            await telegramAdapter.send({
              organizationId: meeting.canonicalOrgId || 'default',
              conversationId: `conv_tg_${meeting.canonicalOrgId}_${tgBinding.externalUserId}`,
              content: messageContent,
              message: { messageId: `fw_${Date.now()}`, content: messageContent, externalMessageId: '' }
            } as any);
            sent = true;
          } catch {
            console.error(`[Sovereign FollowUp] Telegram failed for ${participant.identityId}`);
          }
        }
      }

      const nextStatus = sent ? 'sent' : attempted ? 'pending' : 'no_action';

      await db
        .update(meetingParticipants)
        .set({ followUpStatus: nextStatus })
        .where(eq(meetingParticipants.id, participant.id));

      if (sent) summary.sent++;
      else if (nextStatus === 'pending') summary.pending++;
      else summary.noAction++;
    }
  }

  return summary;
}
