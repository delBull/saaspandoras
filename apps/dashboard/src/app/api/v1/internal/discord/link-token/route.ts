import { NextResponse } from 'next/server';
import { signLinkToken } from '@/lib/discord/oauth';
import { isDiscordBotConfigured } from '@/lib/discord/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `POST /api/v1/internal/discord/link-token`
 *
 * Uso interno (bot de Discord). El bot ya sabe **quién** habla (el autor del
 * mensaje), así que puede pedir un token de vínculo sin OAuth ni client secret.
 * El usuario sólo tiene que firmar con su wallet en `/discord/link`.
 *
 * Auth: `x-internal-secret` (cabecera que usa el gateway) o `Authorization: Bearer`.
 * Body: { discordUserId, tenant? }
 */
export async function POST(req: Request) {
  const secret = process.env.INTERNAL_SECRET;
  const provided = req.headers.get('x-internal-secret') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!secret || provided !== secret) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  let body: { discordUserId?: string; tenant?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const discordUserId = String(body.discordUserId || '').trim();
  if (!/^\d{15,25}$/.test(discordUserId)) {
    return NextResponse.json({ success: false, error: 'INVALID_DISCORD_USER' }, { status: 400 });
  }

  if (!isDiscordBotConfigured()) {
    return NextResponse.json({ success: false, error: 'DISCORD_NOT_CONFIGURED' }, { status: 503 });
  }

  try {
    const { token, expiresAt } = signLinkToken(discordUserId);
    const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance').replace(/\/$/, '');
    return NextResponse.json({
      success: true,
      url: `${base}/discord/link?t=${encodeURIComponent(token)}`,
      expiresAt,
      expiresInMinutes: Math.round((expiresAt - Date.now()) / 60000),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'LINK_TOKEN_FAILED' }, { status: 500 });
  }
}
