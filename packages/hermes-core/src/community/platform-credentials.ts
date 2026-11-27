/**
 * 🔑 Credenciales de plataforma por tenant, sin vault (ADR-020 §2.2-bis)
 *
 * El webhook de Instagram ya resolvía el tenant y el token por entorno
 * (`META_IG_*_<SLUG>` + `extraConfig.community`). El **publicador** exigía una
 * fila cifrada en `tenant_social_integrations`, lo que obligaba a tener la KEK
 * de producción a mano y bloqueaba publicar sin ella.
 *
 * Esta función cierra esa asimetría: si existe la fila, manda la fila (vault);
 * si no, se usan las credenciales del entorno con el mismo criterio. Es pura:
 * recibe env y config como argumentos para poder probarla.
 */

export interface PlatformCredentials {
  igUserId: string;
  accessToken: string;
  apiBase: string;
}

const DEFAULT_IG_API_BASE = 'https://graph.instagram.com/v21.0';

export function platformEnvSuffix(slug: string): string {
  return String(slug || '').toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

export function buildInstagramEnvCredentials(input: {
  slug: string;
  env?: Record<string, string | undefined>;
  /** `projects.extraConfig.community` del tenant, si existe. */
  community?: { igUserId?: string; igApiBase?: string } | null;
}): PlatformCredentials | null {
  const env = input.env ?? process.env;
  const suffix = platformEnvSuffix(input.slug);
  if (!suffix) return null;

  const igUserId = String(
    env[`META_IG_USER_ID_${suffix}`] || input.community?.igUserId || '',
  ).trim();
  const accessToken = String(env[`META_IG_ACCESS_TOKEN_${suffix}`] || '').trim();
  const apiBase = String(
    env[`META_IG_API_BASE_${suffix}`] || input.community?.igApiBase || DEFAULT_IG_API_BASE,
  ).replace(/\/$/, '');

  if (!igUserId || !accessToken) return null;
  return { igUserId, accessToken, apiBase };
}
