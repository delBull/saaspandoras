/**
 * 🧭 Prefijo de canales por tenant (ADR-020 §2.5)
 *
 * El hub de Discord hospeda varios tenants en el mismo servidor. Cada tenant
 * escribe y lee sólo en sus canales: `<prefijo>-<canal>`.
 *
 * Por defecto el prefijo es el slug del tenant. Existe una tabla de alias porque
 * S'Narai nació antes de esta regla y sus canales se llaman `s-narai-*`, no
 * `snarai-*`. Los tenants nuevos no necesitan alias: usan `<slug>-*`.
 */
const LEGACY_PREFIXES: Record<string, string> = {
  snarai: 's-narai',
};

/** Prefijo válido (minúsculas, números y guiones) o `null` si el slug no sirve. */
export function resolveChannelPrefix(canonicalOrgId: string): string | null {
  const slug = String(canonicalOrgId || '').toLowerCase().trim();
  if (!slug) return null;
  const prefix = (LEGACY_PREFIXES[slug] ?? slug).replace(/[^a-z0-9-]/g, '');
  return prefix.length >= 2 ? prefix : null;
}

/** ¿El canal pertenece al tenant? (nombre sin `#`) */
export function isChannelOfTenant(channelName: string, canonicalOrgId: string): boolean {
  const prefix = resolveChannelPrefix(canonicalOrgId);
  if (!prefix) return false;
  return new RegExp(`^${prefix}-[a-z0-9-]+$`).test(String(channelName || ''));
}
