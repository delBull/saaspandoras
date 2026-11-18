import { sendEmail } from "@saasfly/shared";
import { findPresentation } from "@/lib/nexus/presentations-catalog";

/**
 * 🏛️ ARCHITECTURE NOTE: Invitaciones a una presentación (una sola implementación)
 * ==============================================================================
 * La usan los dos caminos de agenda:
 *   1. Deal Room → `POST /api/nexus/deals/:id/schedule` (con deal y propuesta).
 *   2. Agenda Soberana → `POST /api/v1/nexus/agenda/meet/create` (reunión suelta).
 *
 * Cada invitado recibe su link personal `/meet/<id>?p=<joinToken>`, que es lo que
 * registra asistencia. El resultado se reporta con números reales: si el envío falla,
 * se cuenta como fallido (nunca se finge entrega).
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface InviteRecipient {
  email: string;
  joinToken?: string | null;
}

export interface InviteResult {
  sent: number;
  failed: number;
  errors: string[];
}

function inviteEmailHtml(input: {
  startsAt: Date;
  endsAt: string | null;
  deckTitle: string | null;
  joinUrl: string;
  dealRoomUrl: string | null;
  proposalUrl: string | null;
  counterparty: string;
}): string {
  const { startsAt, endsAt, deckTitle, joinUrl, dealRoomUrl, proposalUrl, counterparty } = input;
  const fmt = (value: Date) =>
    value.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short", timeZone: "America/Mexico_City" });
  const when = endsAt ? `${fmt(startsAt)} (hasta ${fmt(new Date(endsAt))})` : fmt(startsAt);

  const links = [
    dealRoomUrl ? `Expediente: <a href="${dealRoomUrl}" style="color:#fbbf24;">Deal Room</a>` : null,
    proposalUrl ? `Propuesta: <a href="${proposalUrl}" style="color:#fbbf24;">ver documento</a>` : null,
  ].filter(Boolean).join(" · ");

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><title>Invitación a la presentación</title></head>
<body style="margin:0;padding:0;background-color:#08080C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;margin:0 auto;background:#0F0F18;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#0a0a1a 0%,#1a0533 100%);padding:28px 32px;text-align:center;">
          <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(251,191,36,0.7);margin-bottom:10px;">PANDORA'S · SOVEREIGN MEET</div>
          <div style="font-size:22px;font-weight:700;color:#ffffff;">Presentación agendada</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;">${counterparty}</div>
        </td></tr>
        <tr><td style="padding:30px 32px;">
          <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.5);">Cuándo</p>
          <p style="margin:0 0 20px;font-size:15px;color:#ffffff;font-weight:600;">${when}</p>
          ${deckTitle ? `<p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.5);">Presentación</p>
          <p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.85);">${deckTitle}</p>` : ''}
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${joinUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 30px;border-radius:10px;">
              Entrar a la sala
            </a>
          </td></tr></table>
          ${links ? `<p style="margin:22px 0 0;font-size:12px;color:rgba(255,255,255,0.5);text-align:center;">${links}</p>` : ''}
        </td></tr>
        <tr><td style="background:#080810;padding:14px 28px;border-top:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:10px;color:rgba(255,255,255,0.28);text-align:center;">Pandora's Group · Confidential</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function defaultAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NODE_ENV === "production" ? "https://dash.pandoras.finance" : "http://localhost:3000")
  );
}

export async function sendMeetingInvites(input: {
  meetingId: string;
  startsAt: Date;
  endsAt: string | null;
  deckSlug: string | null;
  recipients: InviteRecipient[];
  baseUrl: string;
  counterparty: string;
  dealRoomUrl?: string | null;
}): Promise<InviteResult> {
  const { meetingId, startsAt, endsAt, deckSlug, recipients, baseUrl, counterparty, dealRoomUrl } = input;
  const deck = findPresentation(deckSlug);
  const deckTitle = deck?.title ?? null;
  const proposalUrl = deck?.proposalHref ? `${baseUrl}${deck.proposalHref}` : null;

  const result: InviteResult = { sent: 0, failed: 0, errors: [] };

  for (const recipient of recipients) {
    const email = recipient.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      result.failed++;
      result.errors.push(`${email}:INVALID_EMAIL`);
      continue;
    }

    const joinUrl = recipient.joinToken
      ? `${baseUrl}/meet/${meetingId}?p=${recipient.joinToken}`
      : `${baseUrl}/meet/${meetingId}`;

    try {
      const outcome = await sendEmail({
        to: email,
        subject: `Presentación agendada · ${counterparty}`,
        html: inviteEmailHtml({
          startsAt,
          endsAt,
          deckTitle,
          joinUrl,
          dealRoomUrl: dealRoomUrl ?? null,
          proposalUrl,
          counterparty,
        }),
      });
      if (outcome?.success) {
        result.sent++;
      } else {
        result.failed++;
        result.errors.push(`${email}:${outcome?.error ?? "NOT_SENT"}`);
      }
    } catch (error) {
      result.failed++;
      result.errors.push(`${email}:SEND_FAILED`);
      console.error("[MeetingInvites] send failed:", error);
    }
  }

  return result;
}
