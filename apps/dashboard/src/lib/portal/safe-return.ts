/**
 * Destino de retorno seguro para el login del portal.
 *
 * El parámetro `return` viene de la URL, así que es input del cliente: sólo se
 * acepta una ruta relativa del mismo origen. Nada de `//host`, `\`, espacios ni
 * rutas de API.
 *
 * Antes sólo se aceptaban rutas `/portal/…`, lo que descartaba en silencio el
 * retorno a `/growth-os/…` (el usuario acababa en el portal y no en la pantalla
 * que había pedido).
 */
const SAFE_PATH = /^\/(?!\/)[A-Za-z0-9._~\-/]*$/;
const MAX_LENGTH = 200;
const BLOCKED_PREFIXES = ['/api/', '/portal/login'];

export function isSafeReturnPath(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const path = value.trim();
  if (!path || path.length > MAX_LENGTH) return false;
  if (!SAFE_PATH.test(path)) return false;
  if (path.includes('..')) return false;
  return !BLOCKED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/** Normaliza el retorno: `null` si no es seguro, sin barra final si lo es. */
export function normalizeReturnPath(value: unknown): string | null {
  if (!isSafeReturnPath(value)) return null;
  const path = (value as string).trim().replace(/\/+$/, '');
  return path || null;
}

/** Slug del tenant cuando el retorno apunta a su espacio (`/growth-os/...` o `/portal/...`). */
export function slugFromReturnPath(value: unknown): string | null {
  const path = normalizeReturnPath(value);
  if (!path) return null;
  const match = path.match(/^\/(?:growth-os\/organizations|portal)\/([a-z0-9][a-z0-9-]*)/i);
  return match?.[1]?.toLowerCase() ?? null;
}
