import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { HermesOSBotAdapter, TelegramUpdate } from '@/lib/hermes/bot/hermes-os-bot';

const botAdapter = new HermesOSBotAdapter();

function secretsMatch(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    // C1 fail-closed: sin secret configurado en producción, rechazar siempre.
    const expectedSecret =
      process.env.HERMES_BOT_WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || '';

    if (!expectedSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[API /api/hermes/bot/webhook] HERMES_BOT_WEBHOOK_SECRET not configured in production.');
        return NextResponse.json({ ok: false, error: 'Service Unavailable' }, { status: 503 });
      }
      console.warn('[API /api/hermes/bot/webhook] No webhook secret configured (non-production).');
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const secretToken = req.headers.get('x-telegram-bot-api-secret-token') ?? '';
    if (!secretsMatch(secretToken, expectedSecret)) {
      console.warn('[API /api/hermes/bot/webhook] Unauthorized webhook attempt: secret token mismatch.');
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const update = (await req.json()) as TelegramUpdate;
    if (!update || typeof update.update_id !== 'number') {
      return NextResponse.json({ ok: false, error: 'Invalid update payload' }, { status: 400 });
    }

    const result = await botAdapter.handleUpdate(update);
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error('[API /api/hermes/bot/webhook] Webhook handling error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}
