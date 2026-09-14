/**
 * 🤖 Nexus Team Bot — Webhook Route Handler
 * apps/dashboard/src/app/api/integrations/telegram/team/route.ts
 *
 * Transport endpoint for @nexusPandoras_bot (Nexus OS · Team).
 *
 * Security Chain:
 *   1. Validates x-telegram-bot-api-secret-token header (fail-closed, 403).
 *   2. Parses the Telegram Update object.
 *   3. Dispatches to the appropriate handler (/start, callbacks).
 *   4. Always returns 200 to Telegram (avoid retry storms on logic errors).
 *
 * Invariants:
 *   - NO identity resolution or authorization happens here.
 *     This file is PURELY transport.
 *   - NO business logic: approvals, capability checks, or DB writes.
 *   - Callback processing (Phase 5) will be added in a separate handler
 *     once the nexus_action_requests table exists.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  NexusTeamTransport,
  type TelegramUpdate,
} from '@/lib/nexus/telegram-team-transport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lazily instantiated — throws on missing token (fail-closed)
function getTransport(): NexusTeamTransport {
  return new NexusTeamTransport();
}

import { db } from '@/db';
import { nexusCollaborators, nexusTelegramInvites } from '@/db/schema';
import { eq, or, isNull } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Handle command: /start
 * Greets the operator and sets up the persistent Nexus Command button.
 * If an invite token is provided (/start inv_...), validates it and binds the Telegram ID securely.
 */
async function handleStartCommand(
  transport: NexusTeamTransport,
  chatId: number,
  firstName?: string,
  text?: string
): Promise<void> {
  const tmaUrl = process.env.NEXUS_TMA_URL || 'https://nexus.pandoras.finance';
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';
  const name = firstName || 'Operador';

  let linkedMessage = '';

  // Process potential magic link
  if (text && text.startsWith('/start inv_')) {
    const rawToken = text.split(' ')[1];
    
    if (rawToken && rawToken.startsWith('inv_')) {
      // Remove 'inv_' prefix for hashing
      const pureToken = rawToken.substring(4);
      const tokenHash = crypto.createHash('sha256').update(pureToken).digest('hex');

      try {
        await db.transaction(async (tx) => {
          // 1. Validate invite using FOR UPDATE skip locked or standard row lock
          const [invite] = await tx
            .select()
            .from(nexusTelegramInvites)
            .where(eq(nexusTelegramInvites.tokenHash, tokenHash))
            .for('update'); // ATOMIC ROW LOCK

          if (!invite) {
            throw new Error('Invitación inválida o inexistente.');
          }
          if (invite.status !== 'PENDING') {
            throw new Error('Esta invitación ya fue consumida o expirada.');
          }
          if (new Date() > invite.expiresAt) {
            throw new Error('La invitación ha expirado.');
          }

          // 2. Validate Collaborator using FOR UPDATE
          const [collaborator] = await tx
            .select()
            .from(nexusCollaborators)
            .where(eq(nexusCollaborators.id, invite.collaboratorId))
            .for('update'); // ATOMIC ROW LOCK

          if (!collaborator) {
            throw new Error('El perfil de operador ya no existe.');
          }

          // 3. Collision Protection: Prevent silent rebinding
          if (collaborator.telegramUserId) {
            throw new Error('El operador ya tiene una cuenta vinculada.');
          }

          // 4. Collision Protection: Ensure this Telegram ID isn't used by someone else
          const [existingBinding] = await tx
            .select()
            .from(nexusCollaborators)
            .where(eq(nexusCollaborators.telegramUserId, chatId.toString()))
            .limit(1);

          if (existingBinding) {
            throw new Error('Tu cuenta de Telegram ya está vinculada a otro perfil.');
          }

          // 5. Consume & Bind
          await tx
            .update(nexusCollaborators)
            .set({ telegramUserId: chatId.toString() })
            .where(eq(nexusCollaborators.id, collaborator.id));

          await tx
            .update(nexusTelegramInvites)
            .set({
              status: 'CONSUMED',
              consumedAt: new Date(),
              consumedByTelegramUserId: chatId.toString(),
            })
            .where(eq(nexusTelegramInvites.id, invite.id));

          linkedMessage = `Tu cuenta de Nexus ha sido vinculada exitosamente.\n\n`;
        });
      } catch (err: any) {
        console.warn(`[NexusTeamBot] Invite consumption failed: ${err.message}`);
        await transport.sendMessage({
          chat_id: chatId,
          parse_mode: 'HTML',
          text: `❌ <b>Error de Vinculación</b>\n\n${err.message}`,
        });
        return;
      }
    }
  }

  await transport.sendMessage({
    chat_id: chatId,
    parse_mode: 'HTML',
    text: [
      `<b>⬡ NEXUS OS · TEAM</b>`,
      ``,
      `Hola, <b>${name}</b> 👋.`,
      linkedMessage,
      `Este es tu centro de mando operativo.`,
      `Tus herramientas de alto nivel al alcance:`,
      ``,
      `🔐 <b>Aprobaciones</b> — KYC, depósitos y campañas pendientes`,
      `🧠 <b>Hermes HITL</b> — Intervenciones que requieren operador`,
      `📊 <b>Operaciones</b> — Alertas del ecosistema en tiempo real`,
      ``,
      `Todo bajo control. Todo desde aquí.`,
    ].join('\n'),
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '⚡ Abrir Nexus',
            web_app: { url: tmaUrl },
          },
        ],
        [
          {
            text: '🌐 Dashboard Completo',
            url: dashboardUrl,
          },
        ],
      ],
    },
  });

  // Configure the persistent menu button for this chat
  await transport.setChatMenuButton(chatId);
}

import { NexusActionDispatcher } from '@/lib/nexus/nexus-action-dispatcher';

/**
 * Handle callback_query updates.
 * Dispatches the action to NexusActionDispatcher.
 */
async function handleCallbackQuery(
  transport: NexusTeamTransport,
  callbackQueryId: string,
  callbackData: string | undefined,
  from: { id: number; first_name?: string }
): Promise<void> {
  console.info(
    `[NexusTeamBot] Callback from user ${from.id}: ${callbackData ?? '(no data)'}`
  );

  if (!callbackData) {
    await transport.answerCallbackQuery({
      callback_query_id: callbackQueryId,
      text: '❌ Datos de acción inválidos.',
      show_alert: true,
    });
    return;
  }

  const dispatcher = new NexusActionDispatcher(transport);
  await dispatcher.executeAction(callbackData, from.id.toString(), callbackQueryId);
}
/**
 * POST /api/integrations/telegram/team
 * Receives all updates from @nexusPandoras_bot.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Validate the secret token header (fail-closed)
  const incomingSecret = req.headers.get('x-telegram-bot-api-secret-token');
  if (!NexusTeamTransport.validateWebhookSecret(incomingSecret)) {
    console.warn('[NexusTeamBot] Webhook secret token mismatch — rejecting update.');
    // Return 200 anyway to avoid Telegram retry storms on spoofed requests.
    // The mismatch is logged; a real retry from Telegram will have the correct token.
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  // 2. Parse the Telegram Update
  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    console.error('[NexusTeamBot] Failed to parse Telegram update body.');
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // 3. Instantiate transport (fail-closed if token missing)
  let transport: NexusTeamTransport;
  try {
    transport = getTransport();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[NexusTeamBot] Transport init failed:', message);
    return NextResponse.json({ ok: false, error: 'transport_init_failed' }, { status: 500 });
  }

  // 4. Dispatch
  try {
    if (update.message) {
      const { text, chat, from } = update.message;
      const chatId = chat.id;

      if (text?.startsWith('/start')) {
        await handleStartCommand(transport, chatId, from?.first_name, text);
      } else if (text) {
        // Unknown messages: nudge to use the Command Center UI
        await transport.sendMessage({
          chat_id: chatId,
          parse_mode: 'HTML',
          text: 'Usa el botón <b>⚡ Nexus Command Center</b> para gestionar tus operaciones.',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '⚡ Abrir Nexus',
                  web_app: { url: process.env.NEXUS_TMA_URL || 'https://nexus.pandoras.finance' },
                },
              ],
            ],
          },
        });
      }
    } else if (update.callback_query) {
      const { id, from, data, message } = update.callback_query;
      void message; // will be used in Phase 5 for context
      await handleCallbackQuery(transport, id, data, from);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Log but always return 200 to avoid Telegram retry storms.
    console.error('[NexusTeamBot] Handler error (non-fatal for Telegram):', message);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
