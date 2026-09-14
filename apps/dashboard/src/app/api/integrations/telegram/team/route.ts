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

/**
 * Handle command: /start
 * Greets the operator and sets up the persistent Nexus Command button.
 */
async function handleStartCommand(
  transport: NexusTeamTransport,
  chatId: number,
  firstName?: string
): Promise<void> {
  const tmaUrl = process.env.NEXUS_TMA_URL || 'https://nexus.pandoras.finance';
  const greeting = firstName ? `Hola, <b>${firstName}</b>.` : 'Hola.';

  await transport.sendMessage({
    chat_id: chatId,
    parse_mode: 'HTML',
    text: [
      `⚡ <b>Nexus OS · Team</b>`,
      ``,
      `${greeting}`,
      ``,
      `Soy tu canal de comando operativo móvil. Aquí recibirás:`,
      `• 🔐 Solicitudes de aprobación (colaboradores, depósitos, campañas)`,
      `• 🧠 Intervenciones urgentes de Hermes (HITL)`,
      `• 📊 Alertas de operaciones del equipo`,
      ``,
      `Pulsa el botón para abrir tu <b>Command Center</b>.`,
    ].join('\n'),
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '⚡ Abrir Nexus Command Center',
            web_app: { url: tmaUrl },
          },
        ],
      ],
    },
  });

  // Configure the persistent menu button for this chat
  await transport.setChatMenuButton(chatId);
}

/**
 * Handle callback_query updates.
 * Phase 1: acknowledges the query; Phase 5 will add action execution.
 */
async function handleCallbackQuery(
  transport: NexusTeamTransport,
  callbackQueryId: string,
  callbackData: string | undefined,
  from: { id: number; first_name?: string }
): Promise<void> {
  // Phase 5 will route to NexusActionDispatcher based on callbackData.
  // For now: acknowledge to remove the Telegram loading spinner.
  console.info(
    `[NexusTeamBot] Callback from user ${from.id}: ${callbackData ?? '(no data)'}`
  );

  await transport.answerCallbackQuery({
    callback_query_id: callbackQueryId,
    text: '⏳ Funcionalidad de acción en construcción.',
    show_alert: false,
  });
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
        await handleStartCommand(transport, chatId, from?.first_name);
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
