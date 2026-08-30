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

export async function GET(req: NextRequest) {
  try {
    const botToken =
      process.env.HERMES_TELEGRAM_BOT_TOKEN ||
      process.env.HERMES_BOT_TOKEN ||
      process.env.TELEGRAM_BOT_TOKEN ||
      '';
    const expectedSecret =
      process.env.HERMES_WEBHOOK_SECRET ||
      process.env.HERMES_BOT_WEBHOOK_SECRET ||
      process.env.TELEGRAM_WEBHOOK_SECRET ||
      '';

    const host = req.headers.get('host') || 'dash.pandoras.finance';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/hermes/bot/webhook`;

    if (!botToken) {
      return NextResponse.json({
        ok: false,
        error: 'HERMES_TELEGRAM_BOT_TOKEN is not configured in environment variables.',
      }, { status: 500 });
    }

    const url = new URL(req.url);
    const shouldSetup = url.searchParams.get('setup') === 'true' || url.searchParams.get('sync') === 'true';

    // If ?setup=true, call Telegram Bot API setWebhook with secret_token
    if (shouldSetup) {
      const setWebhookUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}${expectedSecret ? `&secret_token=${encodeURIComponent(expectedSecret)}` : ''}&allowed_updates=${encodeURIComponent(JSON.stringify(['message', 'callback_query']))}`;
      const setRes = await fetch(setWebhookUrl);
      const setData = await setRes.json();

      return NextResponse.json({
        ok: true,
        action: 'SET_WEBHOOK',
        webhookUrl,
        secretConfigured: Boolean(expectedSecret),
        telegramResponse: setData,
      });
    }

    // Otherwise, inspect current webhook info from Telegram
    const [infoRes, meRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`).then(r => r.json()).catch(e => ({ error: e.message })),
      fetch(`https://api.telegram.org/bot${botToken}/getMe`).then(r => r.json()).catch(e => ({ error: e.message })),
    ]);

    return NextResponse.json({
      ok: true,
      targetWebhookUrl: webhookUrl,
      secretConfigured: Boolean(expectedSecret),
      bot: meRes,
      webhookInfo: infoRes,
      setupInstruction: `To synchronize webhook with secret token, visit: ${webhookUrl}?setup=true`,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // C1 fail-closed: sin secret configurado en producción, rechazar siempre.
    const expectedSecret =
      process.env.HERMES_WEBHOOK_SECRET ||
      process.env.HERMES_BOT_WEBHOOK_SECRET ||
      process.env.TELEGRAM_WEBHOOK_SECRET ||
      '';

    if (!expectedSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[API /api/hermes/bot/webhook] Webhook secret (HERMES_WEBHOOK_SECRET or HERMES_BOT_WEBHOOK_SECRET) not configured in production.');
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
