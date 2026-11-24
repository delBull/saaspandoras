/**
 * 🎭 Discord · configuración y política de roles (S'Narai)
 *
 * Fail-closed: sin las variables de entorno, el módulo lanza. Nada se activa
 * "a medias" ni asigna roles por defecto.
 *
 * Variables requeridas:
 *   DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET  → OAuth2 (scope: identify)
 *   DISCORD_BOT_TOKEN                          → asignar/quitar roles (REST)
 *   DISCORD_GUILD_ID                           → servidor de Pandora's
 *   DISCORD_OAUTH_REDIRECT_URI                 → URL exacta del callback
 *   DISCORD_ROLE_*                             → ids de rol por nivel
 */

export interface DiscordConfig {
  clientId: string;
  clientSecret: string;
  botToken: string;
  guildId: string;
  redirectUri: string;
  roles: {
    /** Rol base de la capa pública (no da acceso a nada sensible). */
    member: string;
    /** Rol de la capa privada: requiere participación verificada. */
    verified: string;
    explorer: string;
    resident: string;
    institutional: string;
    riviera: string;
  };
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

export function getDiscordConfig(): DiscordConfig {
  return {
    clientId: required('DISCORD_CLIENT_ID'),
    clientSecret: required('DISCORD_CLIENT_SECRET'),
    botToken: required('DISCORD_BOT_TOKEN'),
    guildId: required('DISCORD_GUILD_ID'),
    redirectUri: required('DISCORD_OAUTH_REDIRECT_URI'),
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

/** true si la integración está configurada (para mostrar/ocultar el botón). */
export function isDiscordConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_CLIENT_ID &&
    process.env.DISCORD_CLIENT_SECRET &&
    process.env.DISCORD_BOT_TOKEN &&
    process.env.DISCORD_GUILD_ID &&
    process.env.DISCORD_OAUTH_REDIRECT_URI,
  );
}

export const DISCORD_OAUTH_SCOPES = ['identify', 'guilds.join'] as const;
