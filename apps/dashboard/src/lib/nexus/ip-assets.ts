/**
 * Contratos compartidos del registro de Activos IP.
 *
 * Vive en `lib` (no en una ruta): los archivos `route.ts` de Next solo deben
 * exportar handlers HTTP y configuración; exportar constantes desde ahí rompe
 * la validación de tipos de la ruta.
 */

export const IP_STATUSES = ["PLANNED", "FILED", "PENDING", "ACTIVE", "ABANDONED"] as const;
export const IP_RISKS = ["LOW", "MEDIUM", "HIGH"] as const;
export const IP_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export const IP_ASSET_LIMITS = {
  name: 200,
  category: 64,
  classes: 128,
  jurisdiction: 64,
  registryRef: 128,
  nextAction: 500,
  riskNotes: 2000,
} as const;

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export function pickEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase() as T;
  return allowed.includes(upper) ? upper : null;
}
