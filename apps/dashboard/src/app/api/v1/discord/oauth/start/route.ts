import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createOAuthState, buildAuthorizeUrl } from '@/lib/discord/oauth';
import { isDiscordOAuthConfigured } from '@/lib/discord/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `GET /api/v1/discord/oauth/start`
 * Inicia el vínculo Discord ↔ wallet. El `state` viaja en cookie httpOnly para
 * evitar CSRF en el callback.
 */
export async function GET() {
  if (!isDiscordOAuthConfigured()) {
    return NextResponse.json(
      { success: false, error: 'DISCORD_NOT_CONFIGURED', message: 'La integración de Discord no está configurada.' },
      { status: 503 },
    );
  }

  const state = createOAuthState();
  const jar = await cookies();
  jar.set('discord_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return NextResponse.redirect(buildAuthorizeUrl(state));
}
