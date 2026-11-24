/**
 * 🎭 Discord · OAuth2 (identify) + token de vínculo firmado
 *
 * Flujo:
 *   1. `/api/v1/discord/oauth/start`  → redirige a Discord con `state` en cookie
 *   2. `/api/v1/discord/oauth/callback` → canjea el code, obtiene el usuario y
 *      emite un token de vínculo (HMAC, 10 min)
 *   3. `/discord/link?t=…` → el usuario firma con su wallet; el servidor verifica
 *      el token y la firma, guarda el vínculo y sincroniza roles
 */
import crypto from 'crypto';
import { getDiscordConfig, DISCORD_OAUTH_SCOPES } from './config';

const LINK_TTL_MS = 10 * 60 * 1000;

function linkSecret(): string {
  const secret = process.env.DISCORD_LINK_SECRET || process.env.NEXUS_DEAL_TOKEN_SECRET;
  if (!secret) {
    throw new Error('[Discord] Falta DISCORD_LINK_SECRET (o NEXUS_DEAL_TOKEN_SECRET) para firmar el vínculo.');
  }
  return secret;
}

export function createOAuthState(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function buildAuthorizeUrl(state: string): string {
  const cfg = getDiscordConfig();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    response_type: 'code',
    redirect_uri: cfg.redirectUri,
    scope: DISCORD_OAUTH_SCOPES.join(' '),
    state,
    prompt: 'consent',
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export interface DiscordUser {
  id: string;
  username: string;
  globalName?: string | null;
}

export async function exchangeCodeForUser(code: string): Promise<DiscordUser> {
  const cfg = getDiscordConfig();

  const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: cfg.redirectUri,
    }),
    cache: 'no-store',
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text().catch(() => '');
    throw new Error(`[Discord] Token exchange falló (${tokenRes.status}): ${text.slice(0, 160)}`);
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) throw new Error('[Discord] La respuesta no incluyó access_token.');

  const userRes = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    cache: 'no-store',
  });
  if (!userRes.ok) throw new Error(`[Discord] No se pudo leer el usuario (${userRes.status}).`);

  const user = (await userRes.json()) as { id: string; username: string; global_name?: string | null };
  return { id: user.id, username: user.username, globalName: user.global_name ?? null };
}

/** Token de vínculo: `discordId.expiry.hmac` (base64url del HMAC). */
export function signLinkToken(discordUserId: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + LINK_TTL_MS;
  const payload = `${discordUserId}.${expiresAt}`;
  const mac = crypto.createHmac('sha256', linkSecret()).update(payload).digest('base64url');
  return { token: `${payload}.${mac}`, expiresAt };
}

export function verifyLinkToken(token: string): { discordUserId: string; expiresAt: number } | null {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [discordUserId, expiresRaw, mac] = parts;
  const expiresAt = Number(expiresRaw);
  if (!discordUserId || !mac || !Number.isFinite(expiresAt)) return null;
  if (Date.now() > expiresAt) return null;

  const expected = crypto.createHmac('sha256', linkSecret()).update(`${discordUserId}.${expiresAt}`).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return { discordUserId, expiresAt };
}

/** Mensaje que el usuario firma con su wallet (incluye el token para evitar replay). */
export function buildLinkMessage(discordUserId: string, token: string): string {
  return [
    'Autorizo vincular mi cuenta de Discord a mi wallet en Pandora\'s Growth OS.',
    `Discord ID: ${discordUserId}`,
    `Token: ${token.slice(-24)}`,
    'Este mensaje no autoriza ninguna transacción ni transferencia de fondos.',
  ].join('\n');
}
