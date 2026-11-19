import { db } from "@saasfly/db";
import { meetings, meetingParticipants } from "@saasfly/db/schema";
import { and, eq, gte, lte } from "@saasfly/db-core";
import { sendEmail } from "@saasfly/shared";
import { findPresentation } from "@/lib/nexus/presentations-catalog";
import { defaultAppBaseUrl } from "@/lib/nexus/meeting-invites";
import { icsAttachment } from "@/lib/nexus/ics";

/**
 * 🏛️ ARCHITECTURE NOTE: Recordatorios de reunión (24 h y 1 h antes)
 * =================================================================
 * Zoom/Meet avisan antes de la sesión; sin esto la reunión se le olvida al invitado.
 *
 * Idempotencia: cada participante tiene `reminder_24h_sent_at` / `reminder_1h_sent_at`.
 * Si el envío falla, la columna queda NULL y el siguiente tick reintenta. Nunca se marca
 * "enviado" sin confirmación de Resend.
 *
 * Ventanas (tolerantes para un cron cada 15 min):
 *   - 24 h: entre ahora + 23 h 30 min y ahora + 24 h 30 min
 *   - 1 h:  entre ahora + 50 min y ahora + 70 min
 */

const HOUR_MS = 60 * 60 * 1000;

export interface ReminderSummary {
  window24h: number;
  window1h: number;
  sent: number;
  failed: number;
}

type ReminderKind = "24h" | "1h";

function reminderEmailHtml(input: {
  kind: ReminderKind;
  startsAt: Date;
  endsAt: Date | null;
  deckTitle: string | null;
  joinUrl: string;
  counterparty: string;
}): string {
  const { kind, startsAt, endsAt, deckTitle, joinUrl, counterparty } = input;
  const fmt = (d: Date) =>
    d.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short", timeZone: "America/Mexico_City" });
  const when = endsAt ? `${fmt(startsAt)} – ${fmt(endsAt)}` : fmt(startsAt);
  const lead = kind === "24h" ? "Tu presentación es mañana" : "Tu presentación es en 1 hora";

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><title>${lead}</title></head>
<body style="margin:0;padding:0;background-color:#08080C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;margin:0 auto;background:#0F0F18;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#0a0a1a 0%,#1a0533 100%);padding:26px 32px;text-align:center;">
          <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(251,191,36,0.7);margin-bottom:8px;">PANDORA'S · SOVEREIGN MEET</div>
          <div style="font-size:21px;font-weight:700;color:#ffffff;">${lead}</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;">${counterparty}</div>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.5);">Cuándo</p>
          <p style="margin:0 0 18px;font-size:15px;color:#ffffff;font-weight:600;">${when}</p>
          ${deckTitle ? `<p style="margin:0 0 18px;font-size:14px;color:rgba(255,255,255,0.8);">Presentación: ${deckTitle}</p>` : ''}
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${joinUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 30px;border-radius:10px;">
              Entrar a la sala
            </a>
          </td></tr></table>
          <p style="margin:20px 0 0;font-size:12px;color:rgba(255,255,255,0.45);text-align:center;">
            Adjuntamos el evento para tu calendario. La liga es personal.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendRemindersForWindow(
  now: Date,
  kind: ReminderKind,
  summary: ReminderSummary
): Promise<void> {
  const from = new Date(
    now.getTime() + (kind === "24h" ? 23.5 * HOUR_MS : 50 * 60 * 1000)
  );
  const to = new Date(
    now.getTime() + (kind === "24h" ? 24.5 * HOUR_MS : 70 * 60 * 1000)
  );

  const dueMeetings = await db
    .select()
    .from(meetings)
    .where(and(eq(meetings.status, "scheduled"), gte(meetings.startsAt, from), lte(meetings.startsAt, to)));

  if (dueMeetings.length === 0) return;
  if (kind === "24h") summary.window24h = dueMeetings.length;
  else summary.window1h = dueMeetings.length;

  const baseUrl = defaultAppBaseUrl();

  for (const meeting of dueMeetings) {
    const participants = await db
      .select()
      .from(meetingParticipants)
      .where(eq(meetingParticipants.meetingId, meeting.id));

    const pending = participants.filter((p) => {
      if (!p.email) return false; // invitados anónimos no reciben correo
      return kind === "24h" ? !p.reminder24hSentAt : !p.reminder1hSentAt;
    });
    if (pending.length === 0) continue;

    const deck = findPresentation(meeting.presentationId);
    const startsAt = meeting.startsAt ?? now;
    const endsAt = meeting.endsAt ? new Date(meeting.endsAt) : null;

    for (const participant of pending) {
      const email = String(participant.email).trim().toLowerCase();
      const joinUrl = participant.joinToken
        ? `${baseUrl}/meet/${meeting.id}?p=${participant.joinToken}`
        : `${baseUrl}/meet/${meeting.id}`;

      try {
        const result = await sendEmail({
          to: email,
          subject:
            kind === "24h"
              ? "Recordatorio · tu presentación es mañana"
              : "Recordatorio · tu presentación es en 1 hora",
          html: reminderEmailHtml({
            kind,
            startsAt,
            endsAt,
            deckTitle: deck?.title ?? null,
            joinUrl,
            counterparty: deck?.title ? "Pandora's Group" : "Pandora's Group",
          }),
          attachments: [
            icsAttachment({
              uid: `${meeting.id}@dash.pandoras.finance`,
              start: startsAt,
              end: endsAt ?? new Date(startsAt.getTime() + 30 * 60 * 1000),
              summary: `Presentación · ${deck?.title ?? "Pandora's"}`,
              description: `Entra a la sala: ${joinUrl}`,
              location: joinUrl,
              attendeeEmail: email,
            }),
          ],
        });

        if (result?.success) {
          await db
            .update(meetingParticipants)
            .set(kind === "24h" ? { reminder24hSentAt: new Date() } : { reminder1hSentAt: new Date() })
            .where(eq(meetingParticipants.id, participant.id));
          summary.sent++;
        } else {
          summary.failed++;
          console.error(
            `[MeetingReminders] ${kind} no enviado a ${email}: ${result?.error ?? "unknown"}`
          );
        }
      } catch (error) {
        summary.failed++;
        console.error(`[MeetingReminders] ${kind} falló para ${email}`, error);
      }
    }
  }
}

export async function runMeetingReminders(now: Date = new Date()): Promise<ReminderSummary> {
  const summary: ReminderSummary = { window24h: 0, window1h: 0, sent: 0, failed: 0 };
  await sendRemindersForWindow(now, "24h", summary);
  await sendRemindersForWindow(now, "1h", summary);
  return summary;
}
