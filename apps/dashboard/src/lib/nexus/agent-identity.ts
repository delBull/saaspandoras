/**
 * 🪪 Identidad de agente (ADR-021)
 *
 * Piezas puras y verificables: formato de clave, hash, subconjunto de
 * capabilities y ventana de validez. La lectura de base de datos vive en
 * `agent-store.ts` para poder probar estas reglas sin tocar Postgres.
 */
import crypto from 'node:crypto';

/** Prefijo visible de una clave de agente. */
export const AGENT_KEY_PREFIX = 'nxk_';

/** Días por defecto y máximo de una delegación. */
export const DELEGATION_DEFAULT_DAYS = 30;
export const DELEGATION_MAX_DAYS = 90;

/** Días que vive la clave antes de tener que rotarla. */
export const AGENT_KEY_DEFAULT_DAYS = 90;

/**
 * Genera una clave de agente. El valor en claro se devuelve **una sola vez**;
 * en base de datos sólo queda el hash y el prefijo.
 */
export function createAgentKey() {
  const secret = crypto.randomBytes(24).toString('hex');
  const raw = `${AGENT_KEY_PREFIX}${secret}`;
  return {
    raw,
    prefix: raw.slice(0, AGENT_KEY_PREFIX.length + 6),
    hash: hashAgentKey(raw),
  };
}

/** SHA-256 de la clave (nunca se guarda el valor en claro). */
export function hashAgentKey(raw: string): string {
  return crypto.createHash('sha256').update(raw.trim(), 'utf8').digest('hex');
}

/** `true` si el header Authorization trae una clave con formato de agente. */
export function extractAgentKey(headers: Headers): string | null {
  const auth = headers.get('authorization') || headers.get('x-agent-key') || '';
  const match = auth.match(/^Bearer\s+(nxk_[a-f0-9]{16,})$/i);
  if (match && match[1]) return match[1];
  const direct = auth.trim();
  return /^nxk_[a-f0-9]{16,}$/i.test(direct) ? direct : null;
}

/**
 * Capabilities efectivas de una delegación: **intersección** entre lo pedido y
 * lo que la persona puede realmente. Nunca amplía.
 */
export function intersectCapabilities(
  requested: unknown,
  granted: Iterable<string>,
): string[] {
  // Se devuelve la **forma canónica del permiso** (la que usa la app:
  // `dealRoom`, `hermesQa`…), no la que mandó el cliente. Comparar en minúsculas
  // evita depender del casing, pero almacenar la forma canónica evita que la
  // delegación diga `dealroom` mientras el resto del sistema espera `dealRoom`.
  const canonical = new Map<string, string>();
  for (const item of Array.from(granted)) {
    const value = String(item || '').trim();
    if (value) canonical.set(value.toLowerCase(), value);
  }

  const list = Array.isArray(requested) ? requested : [];
  const out = new Set<string>();
  for (const item of list) {
    const key = String(item || '').trim().toLowerCase();
    const match = key ? canonical.get(key) : undefined;
    if (match) out.add(match);
  }
  return Array.from(out).sort();
}

/** Días válidos para una delegación (1..DELEGATION_MAX_DAYS). */
export function normalizeDelegationDays(input: unknown): number {
  const days = Number(input);
  if (!Number.isFinite(days) || days <= 0) return DELEGATION_DEFAULT_DAYS;
  return Math.min(Math.floor(days), DELEGATION_MAX_DAYS);
}

export interface ValidityWindow {
  status: string;
  expiresAt: Date | string | null;
  revokedAt?: Date | string | null;
}

/** `true` si la credencial está activa y no vencida. Fail-closed. */
export function isWithinValidity(window: ValidityWindow, now: Date = new Date()): boolean {
  if (window.status !== 'ACTIVE') return false;
  if (window.revokedAt) return false;
  if (!window.expiresAt) return false;
  const expires = window.expiresAt instanceof Date ? window.expiresAt : new Date(window.expiresAt);
  if (Number.isNaN(expires.getTime())) return false;
  return expires.getTime() > now.getTime();
}

/**
 * ¿La acción exige confirmación humana aunque esté delegada?
 * Patrones admitidos: `deal.sign`, `payment.*`, `publish.*`.
 */
export function requiresHumanApproval(action: string, patterns: string[]): boolean {
  const target = String(action || '').toLowerCase();
  return patterns.some((pattern) => {
    const p = String(pattern || '').toLowerCase().trim();
    if (!p) return false;
    if (p.endsWith('.*')) return target.startsWith(p.slice(0, -1));
    return target === p;
  });
}

/** ¿El recurso cae dentro del scope delegado? Sin scope explícito, no. */
export function isResourceInScope(
  scope: Record<string, string[]> | null | undefined,
  resource: { type: 'pods' | 'rooms' | 'projects' | string; id: string },
): boolean {
  const bucket = (scope ?? {})[resource.type];
  if (!Array.isArray(bucket) || bucket.length === 0) return false;
  return bucket.map(String).includes(String(resource.id));
}
