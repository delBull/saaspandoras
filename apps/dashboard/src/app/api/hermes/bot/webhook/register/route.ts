import { NextRequest, NextResponse } from 'next/server';
import { requireNexusAdmin } from '@/lib/nexus/collaborators-service';

/**
 * 🔗 POST /api/hermes/bot/webhook/register
 * (Admin-protected) Registers the unified Hermes Telegram webhook with the
 * sovereign secret_token so Telegram signs every update with
 * X-Telegram-Bot-Api-Secret-Token — matched by the fail-closed POST handler.
 */
export async function POST(req: NextRequest) {
  if (!(await requireNexusAdmin(req))) {
    return NextResponse.json({ ok: false, error: 'Admin authentication required' }, { status: 403 });
  }

  const botToken = process.env.HERMES_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!botToken) {
    return NextResponse.json({ ok: false, error: 'HERMES_TELEGRAM_BOT_TOKEN/TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
  }
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: 'TELEGRAM_WEBHOOK_SECRET not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const baseUrlParam = (searchParams.get('baseUrl') || req.headers.get('x-forwarded-host') || '').replace(/\/$/, '');
  const webhookUrl = `${baseUrlParam.startsWith('http') ? baseUrlParam : `https://${baseUrlParam}`}/api/hermes/bot/webhook`;

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&secret_token=${encodeURIComponent(webhookSecret)}&allowed_updates=${encodeURIComponent(JSON.stringify(['message', 'edited_message', 'callback_query']))}`,
    { method: 'GET' }
  );
  const data = await res.json().catch(() => null);

  if (!data?.ok) {
    return NextResponse.json({ ok: false, error: data?.description || 'setWebhook failed' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, webhookUrl, description: data.description || 'Webhook registered with secret_token' });
}

/**
 * GET → webhook health (admin-protected): current Telegram webhook status & pending updates.
 */
export async function GET(req: NextRequest) {
  if (!(await requireNexusAdmin(req))) {
    return NextResponse.json({ ok: false, error: 'Admin authentication required' }, { status: 403 });
  }
  const botToken = process.env.HERMES_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ ok: false, error: 'Bot token not configured' }, { status: 500 });
  }
  const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`, { method: 'GET' });
  const data = await res.json().catch(() => null);
  return NextResponse.json({ ok: data?.ok ?? false, webhook: data?.result ?? null });
}
