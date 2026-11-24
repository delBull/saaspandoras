/**
 * 🎭 Discord · registro de tenants
 *
 * La integración es genérica: cualquier tenant puede habilitarla declarando su
 * slug y (opcionalmente) el id del proyecto cuyos certificados cuentan como
 * participación. S'Narai es el primero; los demás se agregan aquí sin tocar el
 * motor de membresías ni las rutas.
 */

export interface DiscordTenantConfig {
  /** Slug canónico del tenant (coincide con `projects.slug`). */
  slug: string;
  /** Etiqueta humana para mensajes y auditoría. */
  label: string;
  /**
   * Id de `projects.id` cuando se conoce. Si es null, se resuelve por slug en
   * tiempo de ejecución (una consulta) y se cachea por proceso.
   */
  projectId: number | null;
  /** Organización usada para auditoría. */
  organizationId: string;
}

export const DISCORD_TENANTS: Record<string, DiscordTenantConfig> = {
  snarai: {
    slug: 'snarai',
    label: "S'Narai",
    projectId: 17,
    organizationId: 'snarai',
  },
};

export const DEFAULT_DISCORD_TENANT = 'snarai';

export function resolveDiscordTenant(slug?: string | null): DiscordTenantConfig {
  const key = String(slug || DEFAULT_DISCORD_TENANT).toLowerCase().trim();
  const found = DISCORD_TENANTS[key];
  if (!found) {
    throw new Error(
      `[Discord] Tenant '${key}' no está habilitado para vínculo de Discord. ` +
      `Agrégalo en DISCORD_TENANTS para heredar la integración.`,
    );
  }
  return found;
}

/** Tenants habilitados (para selectores o para documentar la herencia). */
export function listDiscordTenants(): DiscordTenantConfig[] {
  return Object.values(DISCORD_TENANTS);
}
