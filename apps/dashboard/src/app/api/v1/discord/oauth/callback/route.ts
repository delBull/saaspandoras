import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForUser, signLinkToken } from '@/lib/discord/oauth';
import { isDiscordOAuthConfigured } from '@/lib/discord/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `GET /api/v1/discord/oauth/callback`
 *
 * Valida el estado, canjea el código y emite un token de vínculo (10 min) para
 * que el usuario firme con su wallet en `/discord/link`. Sin esa firma no se
 * escribe ningún vínculo: el OAuth sólo prueba quién es en Discord, no qué
 * wallet le pertenece.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = (process.env.NEXT_PUBLIC_APP_URL || url.origin).replace(/\/$/, '');

  if (!isDiscordOAuthConfigured()) {
    return NextResponse.redirect(`${base}/discord/link?error=not_configured`);
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const jar = await cookies();
  const expected = jar.get('discord_oauth_state')?.value;
  jar.delete('discord_oauth_state');

  if (url.searchParams.get('error')) {
    return NextResponse.redirect(`${base}/discord/link?error=denied`);
  }
  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(`${base}/discord/link?error=state`);
  }

  try {
    const user = await exchangeCodeForUser(code);
    const { token } = signLinkToken(user.id);
    const dest = new URL(`${base}/discord/link`);
    dest.searchParams.set('t', token);
    dest.searchParams.set('u', user.username);
    return NextResponse.redirect(dest.toString());
  } catch (err: any) {
    console.error('[Discord OAuth] exchange failed:', err?.message);
    return NextResponse.redirect(`${base}/discord/link?error=exchange`);
  }
}
