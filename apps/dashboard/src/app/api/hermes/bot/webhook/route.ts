import { NextRequest, NextResponse } from 'next/server';
import { HermesOSBotAdapter, TelegramUpdate } from '@/lib/hermes/bot/hermes-os-bot';

const botAdapter = new HermesOSBotAdapter();

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate webhook secret token from Telegram header (§7 / C1)
    const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
    const expectedSecret = process.env.HERMES_BOT_WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET;

    if (expectedSecret && secretToken !== expectedSecret) {
      console.warn('[API /api/hermes/bot/webhook] Unauthorized webhook attempt: secret token mismatch.');
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (process.env.NODE_ENV === 'production' && !expectedSecret) {
      console.warn('[API /api/hermes/bot/webhook] Warning: HERMES_BOT_WEBHOOK_SECRET is not configured in production.');
    }

    // 2. Parse and validate Telegram update payload
    const update = (await req.json()) as TelegramUpdate;
    if (!update || typeof update.update_id !== 'number') {
      return NextResponse.json({ ok: false, error: 'Invalid update payload' }, { status: 400 });
    }

    // 3. Dispatch to Hermes OS Bot Adapter
    const result = await botAdapter.handleUpdate(update);
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error('[API /api/hermes/bot/webhook] Webhook handling error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}
