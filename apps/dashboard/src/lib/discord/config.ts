/**
 * 🎭 Discord · configuración y política de roles (S'Narai y heredables)
 *
 * Hay DOS caminos independientes y no deben condicionarse entre sí:
 *
 *  A. Bot (activo hoy): el gateway ya sabe quién habla. Necesita
 *     `DISCORD_BOT_TOKEN` + `DISCORD_GUILD_ID` + el rol verificado.
 *  B. OAuth (dormido): requiere app de Discord con `DISCORD_CLIENT_ID` +
 *     `DISCORD_CLIENT_SECRET` + `DISCORD_OAUTH_REDIRECT_URI`.
 *
 * Fail-closed por camino: cada función lanza o devuelve false si le faltan SUS
 * variables, sin bloquear al otro.
 */

export interface DiscordRoles {
  member: string;
  verified: string;
  explorer: string;
  resident: string;
  institutional: string;
  riviera: string;
}

export interface DiscordBotConfig {
  botToken: string;
  guildId: string;
  roles: DiscordRoles;
}

export interface DiscordOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`[Discord] Falta ${name}. Sin esta variable la integración no opera (fail-closed).`);
  }
  return value.trim();
}

function optional(name: string): string {
  return (process.env[name] || '').trim();
}

export function getDiscordBotConfig(): DiscordBotConfig {
  return {
    botToken: required('DISCORD_BOT_TOKEN'),
    guildId: required('DISCORD_GUILD_ID'),
    roles: {
      member: optional('DISCORD_ROLE_MEMBER'),
      verified: required('DISCORD_ROLE_VERIFIED'),
      explorer: optional('DISCORD_ROLE_EXPLORER'),
      resident: optional('DISCORD_ROLE_RESIDENT'),
      institutional: optional('DISCORD_ROLE_INSTITUTIONAL'),
      riviera: optional('DISCORD_ROLE_RIVIERA'),
    },
  };
}

export function getDiscordOAuthConfig(): DiscordOAuthConfig {
  return {
    clientId: required('DISCORD_CLIENT_ID'),
    clientSecret: required('DISCORD_CLIENT_SECRET'),
    redirectUri: required('DISCORD_OAUTH_REDIRECT_URI'),
  };
}

/** ¿Se puede asignar roles y emitir tokens de vínculo por el bot? */
export function isDiscordBotConfigured(): boolean {
  return Boolean(
    (process.env.DISCORD_BOT_TOKEN || '').trim() &&
    (process.env.DISCORD_GUILD_ID || '').trim() &&
    (process.env.DISCORD_ROLE_VERIFIED || '').trim(),
  );
}

/** ¿Está disponible el flujo OAuth (requiere client secret)? */
export function isDiscordOAuthConfigured(): boolean {
  return Boolean(
    (process.env.DISCORD_CLIENT_ID || '').trim() &&
    (process.env.DISCORD_CLIENT_SECRET || '').trim() &&
    (process.env.DISCORD_OAUTH_REDIRECT_URI || '').trim(),
  );
}

export const DISCORD_OAUTH_SCOPES = ['identify', 'guilds.join'] as const;
