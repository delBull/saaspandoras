/**
 * 🎯 Atribución de primera parte (ADR-020)
 *
 * Un clic en `/l/<code>` deja una cookie con el código. Esa cookie viaja al
 * checkout y a la captura, así que el lead y la orden heredan de qué publicación
 * vino el visitante.
 *
 * El código **no es un secreto** (ya está en la URL pública): sólo identifica una
 * publicación. Aun así se valida el formato para que nunca entre basura en una
 * cabecera o en la base.
 */

export const ATTRIBUTION_COOKIE = 'nx_src';
export const ATTRIBUTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días
export const ATTRIBUTION_CODE_PATTERN = /^[a-z0-9]{4,16}$/;

export function isValidAttributionCode(value: unknown): value is string {
  return typeof value === 'string' && ATTRIBUTION_CODE_PATTERN.test(value);
}

/** Lee el código de una cabecera `cookie` (sirve en el servidor y en el navegador). */
export function readAttributionCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ATTRIBUTION_COOKIE}=([^;]+)`));
  if (!match?.[1]) return null;
  const value = decodeURIComponent(match[1]).trim();
  return isValidAttributionCode(value) ? value : null;
}

/**
 * Resuelve el origen atribuible con prioridad explícita:
 *   1. `?src=` de la URL (el clic más reciente manda)
 *   2. cookie `nx_src` (viene de un clic anterior)
 *   3. nada → `null` (no se inventa un origen)
 */
export function resolveAttributionSource(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (isValidAttributionCode(candidate)) return candidate;
  }
  return null;
}
