import { db } from '@saasfly/db';
import {
  meetings,
  meetingParticipants,
  meetingPresenceSessions,
  channelIdentityBindings,
  meetingActionItems,
} from '@saasfly/db/schema';
import { eq, and } from '@saasfly/db-core';
import { WhatsAppAdapter, TelegramAdapter } from '@saasfly/hermes-core';
import { sendEmail } from '@saasfly/shared';
import { findPresentation } from '@/lib/nexus/presentations-catalog';
import { getDeck } from '@/lib/nexus/deck-repository';
import { buildPresentationRecap } from '@/lib/nexus/presentation-recap';

/**
 * 🏛️ ARCHITECTURE NOTE: Seguimiento post-presentación (una sola implementación)
 * ==========================================================================
 * Dos correos distintos, con idempotencia separada:
 *
 *   1. CORTESÍA (automático, opcional para el host)
 *      `POST /api/v1/meet/end` con `sendFollowUp=true` → `runSovereignFollowUps`.
 *      Solo corre si `meetings.follow_up_enabled = true` (el host pudo desactivarlo).
 *      Si ya existe `aiSummary`, el correo incluye resumen y tareas.
 *
 *   2. RESUMEN (manual, host)
 *      `POST /api/v1/meet/follow-up` → `sendMeetingSummaryFollowUp`.
 *      Envía resumen + tareas a los asistentes que aún no lo recibieron
 *      (`meeting_participants.summary_sent_at IS NULL`).
 *
 * Canales: email primario; WhatsApp/Telegram solo para cortesía si no hay email.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Permanencia mínima para considerar que alguien asistió (segundos). */
const MIN_ATTENDANCE_SECONDS = 60;
const FROM = process.env.RESEND_FROM_EMAIL ?? "Pandora's Group <hello@pandoras.finance>";

export interface FollowUpSummary {
  meetings: number;
  sent: number;
  pending: number;
  noAction: number;
  /** Invitados con link personal que NO entraron (no-show) — solo si la asistencia es conocida */
  noShow: number;
}

export interface SummaryFollowUpResult {
  sent: number;
  skipped: number;
  failed: number;
  /** Correos adicionales (no participantes) que recibieron el seguimiento. */
  extras?: number;
  /** "summary" si había resumen IA; "courtesy" si solo se envió el seguimiento. */
  kind?: "summary" | "courtesy";
  reason?: "NOT_FOUND" | "NOT_ENDED";
}

/** Ajustes del host antes de disparar el seguimiento (pantalla de finalizar). */
export interface FollowUpEmailOptions {
  /** Mensaje libre del host; se inserta arriba del resumen. */
  message?: string | null;
  includeDeck?: boolean;
  includeProposal?: boolean;
  includeTasks?: boolean;
  /** Recap de la presentación (títulos del deck, sin el guión del presentador). */
  includeRecap?: boolean;
  /** Correos adicionales: solo reciben este seguimiento, no recordatorios. */
  extraEmails?: string[];
}

interface SummaryActionItem {
  task: string;
  assigneeName: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function followUpEmailHtml(input: {
  firstName: string;
  meetingTitle: string;
  deckTitle: string | null;
  deckUrl: string | null;
  proposalUrl: string | null;
  summary: string | null;
  actionItems: SummaryActionItem[];
  kind: "courtesy" | "summary";
  /** Mensaje escrito por el host; si existe, se muestra antes del resumen. */
  introMessage?: string | null;
  includeDeck?: boolean;
  includeProposal?: boolean;
  includeTasks?: boolean;
  /** Recap de la presentación (sin guión del presentador). */
  recap?: string | null;
  includeRecap?: boolean;
}): string {
  const {
    firstName,
    meetingTitle,
    deckTitle,
    deckUrl,
    proposalUrl,
    summary,
    actionItems,
    kind,
    introMessage = null,
    includeDeck = true,
    includeProposal = true,
    includeTasks = true,
    recap = null,
    includeRecap = true,
  } = input;

  const actionsHtml =
    includeTasks && actionItems.length > 0
      ? `<div style="margin:22px 0 0;padding:18px 20px;background:rgba(132,204,22,0.06);border:1px solid rgba(132,204,22,0.18);border-radius:12px;">
          <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a3e635;margin-bottom:10px;">Acuerdos y siguientes pasos</div>
          <ul style="margin:0;padding-left:18px;color:rgba(255,255,255,0.8);font-size:14px;line-height:1.7;">
            ${actionItems
              .map(
                (item) =>
                  `<li><strong style="color:#fff;">${escapeHtml(item.task)}</strong>${
                    item.assigneeName ? ` — ${escapeHtml(item.assigneeName)}` : ""
                  }</li>`
              )
              .join("")}
          </ul>
        </div>`
      : "";

  const recapHtml =
    includeRecap && recap?.trim()
      ? `<div style="margin:18px 0 0;padding:18px 20px;background:rgba(129,140,248,0.06);border:1px solid rgba(129,140,248,0.18);border-radius:12px;">
          <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a5b4fc;margin-bottom:10px;">Lo que vimos</div>
          <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;line-height:1.75;white-space:pre-line;">${escapeHtml(
            recap.trim()
          )}</p>
        </div>`
      : "";

  const messageHtml = introMessage?.trim()
    ? `<div style="margin:18px 0 0;padding:16px 18px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.18);border-radius:12px;">
        <p style="margin:0;color:rgba(255,255,255,0.86);font-size:14px;line-height:1.7;">${escapeHtml(
          introMessage.trim()
        ).replace(/\n/g, "<br/>")}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><title>${kind === "summary" ? "Resumen de la sesión" : "Gracias por tu tiempo"}</title></head>
<body style="margin:0;padding:0;background-color:#08080C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080C;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;margin:0 auto;background:#0F0F18;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#0a0a1a 0%,#1a0533 100%);padding:28px 32px;text-align:center;">
          <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(251,191,36,0.7);margin-bottom:10px;">PANDORA'S · SOVEREIGN MEET</div>
          <div style="font-size:22px;font-weight:700;color:#ffffff;">${kind === "summary" ? "Resumen de la sesión" : "Gracias por la sesión"}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:6px;">${escapeHtml(meetingTitle)}</div>
        </td></tr>
        <tr><td style="padding:30px 32px;">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.78);">
            ${firstName ? `Hola ${escapeHtml(firstName)}` : 'Hola'},<br/><br/>
            ${
              kind === "summary"
                ? "Gracias por tu tiempo. Este es el resumen de lo revisado y los acuerdos de la sesión."
                : "Gracias por el tiempo de hoy. Dejamos registrada la sesión y el material presentado."
            }
          </p>
          ${messageHtml}
          ${recapHtml}
          ${
            summary
              ? `<div style="margin:18px 0 0;padding:18px 20px;background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.18);border-radius:12px;">
                  <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#c4b5fd;margin-bottom:10px;">Resumen</div>
                  <p style="margin:0;color:rgba(255,255,255,0.82);font-size:14px;line-height:1.7;">${escapeHtml(summary)}</p>
                </div>`
              : ""
          }
          ${actionsHtml}
          ${
            includeDeck && deckUrl && deckTitle
              ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;"><tr><td align="center">
                  <a href="${deckUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:10px;">
                    Ver la presentación · ${escapeHtml(deckTitle)}
                  </a></td></tr></table>`
              : ""
          }
          ${
            includeProposal && proposalUrl
              ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.75);">
                  Propuesta completa: <a href="${proposalUrl}" style="color:#fbbf24;">ver documento</a>
                </p>`
              : ""
          }
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

function meetingPresentationContext(meeting: {
  presentationId: string | null;
  title: string | null;
}) {
  const deck = findPresentation(meeting.presentationId);
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NODE_ENV === 'production' ? 'https://dash.pandoras.finance' : 'http://localhost:3000');

  return {
    deck,
    meetingTitle: deck?.title ?? meeting.title ?? 'Sovereign Meet',
    deckUrl: deck ? `${baseUrl}${deck.href}` : null,
    proposalUrl: deck?.proposalHref ? `${baseUrl}${deck.proposalHref}` : null,
  };
}

async function actionItemsOf(meetingId: string): Promise<SummaryActionItem[]> {
  try {
    const rows = await db
      .select({ task: meetingActionItems.task, assigneeName: meetingActionItems.assigneeName })
      .from(meetingActionItems)
      .where(eq(meetingActionItems.meetingId, meetingId));
    return rows.map((row) => ({ task: row.task, assigneeName: row.assigneeName ?? null }));
  } catch {
    return [];
  }
}

/**
 * Procesa el seguimiento de CORTESÍA de reuniones terminadas con participantes
 * pendientes. Respeta `meetings.follow_up_enabled = false` (el host lo apagó).
 * @param meetingId Limita el proceso a una reunión (cierre inmediato). Sin parámetro: todas.
 */
export async function runSovereignFollowUps(meetingId?: string): Promise<FollowUpSummary> {
  const summary: FollowUpSummary = { meetings: 0, sent: 0, pending: 0, noAction: 0, noShow: 0 };

  const targetMeetings = meetingId
    ? await db
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.id, meetingId),
            eq(meetings.status, 'ended'),
            eq(meetings.followUpEnabled, true)
          )
        )
    : await db
        .select()
        .from(meetings)
        .where(and(eq(meetings.status, 'ended'), eq(meetings.followUpEnabled, true)));

  if (targetMeetings.length === 0) return summary;

  const whatsappAdapter = new WhatsAppAdapter();
  const telegramAdapter = new TelegramAdapter();

  for (const meeting of targetMeetings) {
    const allParticipants = await db
      .select()
      .from(meetingParticipants)
      .where(eq(meetingParticipants.meetingId, meeting.id));

    // El resumen manual ya enviado no se duplica con la cortesía.
    const pendingParticipants = allParticipants.filter(
      (p) => p.followUpStatus === 'pending' && !p.summarySentAt
    );
    if (pendingParticipants.length === 0) continue;
    summary.meetings++;

    const sessions = await db
      .select()
      .from(meetingPresenceSessions)
      .where(eq(meetingPresenceSessions.meetingId, meeting.id));

    const durationByParticipant = new Map<string, number>();
    for (const session of sessions) {
      if (!session.participantId) continue;
      const end = session.leftAt ?? session.lastSeenAt;
      const seconds = Math.max(
        0,
        Math.round((new Date(end).getTime() - new Date(session.joinedAt).getTime()) / 1000)
      );
      durationByParticipant.set(
        session.participantId,
        (durationByParticipant.get(session.participantId) ?? 0) + seconds
      );
    }

    const presenceKnown = sessions.length > 0;
    const attendanceKnown =
      presenceKnown || allParticipants.some((p) => Boolean(p.joinToken) && Boolean(p.joinedAt));

    const { deck, meetingTitle, deckUrl, proposalUrl } = meetingPresentationContext(meeting);
    const actions = await actionItemsOf(meeting.id);
    const summaryText = meeting.aiSummary?.trim() || null;
    const hasSummary = Boolean(summaryText);

    for (const participant of pendingParticipants) {
      const presenceSeconds = durationByParticipant.get(participant.id) ?? 0;
      const attended = presenceKnown
        ? presenceSeconds >= MIN_ATTENDANCE_SECONDS
        : Boolean(participant.joinedAt);

      if (attendanceKnown && !attended) {
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

      if (EMAIL_PATTERN.test(identity)) {
        attempted = true;
        try {
          const result = await sendEmail({
            to: identity,
            from: FROM,
            subject: hasSummary
              ? `Resumen de la sesión · ${meetingTitle}`
              : `Seguimiento de la sesión${deck ? ` · ${deck.title}` : ''}`,
            html: followUpEmailHtml({
              firstName: identity.split('@')[0] ?? '',
              meetingTitle,
              deckTitle: deck?.title ?? null,
              deckUrl,
              proposalUrl,
              summary: summaryText,
              actionItems: actions,
              kind: hasSummary ? 'summary' : 'courtesy',
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
        const messageContent = hasSummary
          ? `🤖 *Hermes (Agenda Soberana)*\n\nResumen de la sesión: ${summaryText}`
          : `🤖 *Hermes (Agenda Soberana)*\n\nHola, gracias por participar en nuestra Sovereign Meet. Esperamos que la presentación haya sido de valor. Quedamos atentos para cualquier siguiente paso.`;

        if (waBinding) {
          attempted = true;
          try {
            await whatsappAdapter.send({
              organizationId: meeting.canonicalOrgId || 'default',
              conversationId: `conv_wa_${meeting.canonicalOrgId}_${waBinding.externalUserId}`,
              content: messageContent,
              message: { messageId: `fw_${Date.now()}`, content: messageContent, externalMessageId: '' },
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
              message: { messageId: `fw_${Date.now()}`, content: messageContent, externalMessageId: '' },
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
        .set({
          followUpStatus: nextStatus,
          ...(sent && hasSummary ? { summarySentAt: new Date() } : {}),
        })
        .where(eq(meetingParticipants.id, participant.id));

      if (sent) summary.sent++;
      else if (nextStatus === 'pending') summary.pending++;
      else summary.noAction++;
    }
  }

  return summary;
}

/**
 * Envío MANUAL del seguimiento (resumen + tareas cuando existe; cortesía cuando no).
 *
 * No depende de `follow_up_enabled`: es una acción explícita del host desde la
 * pantalla de finalizar. Acepta ajustes del host (mensaje, deck, propuesta,
 * tareas) y correos adicionales que NO se convierten en invitados con recordatorios.
 */
export async function sendMeetingSummaryFollowUp(
  meetingId: string,
  options: FollowUpEmailOptions = {}
): Promise<SummaryFollowUpResult> {
  const result: SummaryFollowUpResult = { sent: 0, skipped: 0, failed: 0, extras: 0 };

  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  if (!meeting) return { ...result, reason: 'NOT_FOUND' };
  if (meeting.status !== 'ended') return { ...result, reason: 'NOT_ENDED' };

  const summaryText = meeting.aiSummary?.trim() || null;
  // Sin resumen IA el correo sigue siendo válido: es seguimiento con el material.
  const kind: 'summary' | 'courtesy' = summaryText ? 'summary' : 'courtesy';
  result.kind = kind;

  const participants = await db
    .select()
    .from(meetingParticipants)
    .where(eq(meetingParticipants.meetingId, meeting.id));

  const sessions = await db
    .select()
    .from(meetingPresenceSessions)
    .where(eq(meetingPresenceSessions.meetingId, meeting.id));

  const durationByParticipant = new Map<string, number>();
  for (const session of sessions) {
    if (!session.participantId) continue;
    const end = session.leftAt ?? session.lastSeenAt;
    const seconds = Math.max(
      0,
      Math.round((new Date(end).getTime() - new Date(session.joinedAt).getTime()) / 1000)
    );
    durationByParticipant.set(
      session.participantId,
      (durationByParticipant.get(session.participantId) ?? 0) + seconds
    );
  }

  const presenceKnown = sessions.length > 0;
  const attendanceKnown =
    presenceKnown || participants.some((p) => Boolean(p.joinToken) && Boolean(p.joinedAt));

  const { deck, meetingTitle, deckUrl, proposalUrl } = meetingPresentationContext(meeting);
  const actions = await actionItemsOf(meeting.id);

  // Recap del deck sembrado en DB (títulos + subtítulos; nunca el guión).
  // Si el CMS falla, el correo sale sin recap: nunca se bloquea el seguimiento.
  let recap: string | null = null;
  if (meeting.presentationId) {
    try {
      const deckDocument = await getDeck(meeting.presentationId);
      recap = buildPresentationRecap(deckDocument);
    } catch (error) {
      console.error(`[Sovereign Summary] recap no disponible para ${meeting.presentationId}`, error);
      recap = null;
    }
  }

  const buildHtml = (firstName: string) =>
    followUpEmailHtml({
      firstName,
      meetingTitle,
      deckTitle: deck?.title ?? null,
      deckUrl,
      proposalUrl,
      summary: summaryText,
      actionItems: actions,
      kind,
      introMessage: options.message ?? null,
      includeDeck: options.includeDeck !== false,
      includeProposal: options.includeProposal !== false,
      includeTasks: options.includeTasks !== false,
      recap,
      includeRecap: options.includeRecap !== false,
    });

  const subject =
    kind === 'summary'
      ? `Resumen de la sesión · ${meetingTitle}`
      : `Seguimiento de la sesión · ${meetingTitle}`;

  for (const participant of participants) {
    if (participant.summarySentAt) {
      result.skipped++;
      continue;
    }
    if (!participant.identityId) {
      result.skipped++;
      continue;
    }

    const identity = participant.identityId.trim();
    if (!EMAIL_PATTERN.test(identity)) {
      result.skipped++;
      continue;
    }

    const presenceSeconds = durationByParticipant.get(participant.id) ?? 0;
    const attended = presenceKnown
      ? presenceSeconds >= MIN_ATTENDANCE_SECONDS
      : Boolean(participant.joinedAt);

    if (attendanceKnown && !attended) {
      result.skipped++;
      continue;
    }

    try {
      const emailResult = await sendEmail({
        to: identity,
        from: FROM,
        subject,
        html: buildHtml(identity.split('@')[0] ?? ''),
      });

      if (emailResult?.success) {
        await db
          .update(meetingParticipants)
          .set({ summarySentAt: new Date(), followUpStatus: 'sent' })
          .where(eq(meetingParticipants.id, participant.id));
        result.sent++;
      } else {
        result.failed++;
        console.error(
          `[Sovereign Summary] Email not sent for ${identity}: ${emailResult?.error ?? 'unknown'}`
        );
      }
    } catch (err) {
      result.failed++;
      console.error(`[Sovereign Summary] Email failed for ${identity}`, err);
    }
  }

  // Correos adicionales: reciben SOLO este seguimiento. Se registran como
  // invitados sin token y con recordatorios marcados, para que ni el cron de
  // cortesía ni el de recordatorios les vuelvan a escribir.
  const already = new Set(
    participants
      .map((p) => (p.identityId ?? '').trim().toLowerCase())
      .filter((value) => value.length > 0)
  );
  const extraEmails = Array.from(
    new Set(
      (options.extraEmails ?? [])
        .map((value) => String(value ?? '').trim().toLowerCase())
        .filter((value) => EMAIL_PATTERN.test(value))
    )
  ).slice(0, 10);

  for (const email of extraEmails) {
    if (already.has(email)) {
      result.skipped++;
      continue;
    }
    try {
      const emailResult = await sendEmail({
        to: email,
        from: FROM,
        subject,
        html: buildHtml(email.split('@')[0] ?? ''),
      });
      if (emailResult?.success) {
        await db.insert(meetingParticipants).values({
          meetingId: meeting.id,
          identityId: email,
          email,
          participantType: 'anonymous_guest',
          role: 'guest',
          followUpStatus: 'sent',
          invitedAt: new Date(),
          summarySentAt: new Date(),
          reminder24hSentAt: new Date(),
          reminder1hSentAt: new Date(),
        });
        result.extras = (result.extras ?? 0) + 1;
      } else {
        result.failed++;
        console.error(
          `[Sovereign Summary] Extra email not sent for ${email}: ${emailResult?.error ?? 'unknown'}`
        );
      }
    } catch (err) {
      result.failed++;
      console.error(`[Sovereign Summary] Extra email failed for ${email}`, err);
    }
  }

  return result;
}
