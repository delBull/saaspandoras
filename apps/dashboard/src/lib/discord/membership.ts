/**
 * 🎭 Discord · resolución de membresía S'Narai
 *
 * Fuente de verdad compuesta (en este orden):
 *   1. `commercial_orders` pagadas/verificadas del proyecto/org S'Narai  → compró
 *   2. `tenant_nft_issuances` del proyecto S'Narai (mint confirmado)    → es titular
 *   3. Otorgamiento manual (tabla de vínculos con `status = ACTIVE`)     → corte administrativo
 *
 * Regla: un rol de nivel (Explorer/Residente/Institucional/Riviera) NO se asigna
 * por comprar: se asigna por **certificados en cartera**. Comprar da el rol
 * `verified` (acceso a la capa privada) y el nivel según el total.
 *
 * Módulo puro: sin red ni DB. La consulta vive en `resolveMembership()` y los
 * tests cubren la clasificación.
 */

export type SnaraiTier = 'EXPLORER' | 'RESIDENT' | 'INSTITUTIONAL' | 'RIVIERA';

/** Umbral de certificados por nivel (alineado con `memberships.tsx`). */
export const SNARAI_TIER_THRESHOLDS: Array<{ tier: SnaraiTier; minCertificates: number }> = [
  { tier: 'RIVIERA', minCertificates: 2000 },
  { tier: 'INSTITUTIONAL', minCertificates: 500 },
  { tier: 'RESIDENT', minCertificates: 50 },
  { tier: 'EXPLORER', minCertificates: 1 },
];

export interface MembershipInput {
  /**
   * Órdenes pagadas/verificadas. `certificates` es opcional: si la orden no
   * registra cuántos certificados incluye, cuenta como acceso (participante)
   * pero NO como nivel — el nivel se calcula con certificados emitidos.
   */
  paidOrders: Array<{ certificates?: number; status: string }>;
  /** Emisiones de certificados confirmadas. */
  mintedCertificates: number;
  /** Concesión administrativa puntual (p. ej. miembro fundador invitado). */
  manualGrant?: { tier?: SnaraiTier; certificates?: number } | null;
}

export interface MembershipResult {
  /** Compró o fue invitado: entra a la capa privada. */
  isParticipant: boolean;
  /** Certificados computables (órdenes pagadas + mints confirmados + concesión). */
  certificates: number;
  /** Nivel más alto alcanzado, o null si no llega a Explorer. */
  tier: SnaraiTier | null;
  /** Por qué se determinó (para auditoría y para el mensaje al usuario). */
  reason: string;
}

const PAID_STATUSES = new Set(['paid', 'PAID', 'verified', 'VERIFIED', 'completed', 'COMPLETED', 'settled', 'SETTLED']);

export function resolveMembership(input: MembershipInput): MembershipResult {
  const paidOrders = (input.paidOrders || []).filter((o) => PAID_STATUSES.has(String(o.status || '').trim()));
  const paidCertificates = paidOrders.reduce((sum, o) => sum + Math.max(0, Number(o.certificates) || 0), 0);

  const minted = Math.max(0, Number(input.mintedCertificates) || 0);
  const manual = input.manualGrant
    ? {
        certificates: Math.max(0, Number(input.manualGrant.certificates) || 0),
        tier: input.manualGrant.tier ?? null,
      }
    : null;

  const certificates = paidCertificates + minted + (manual?.certificates ?? 0);
  const isParticipant = certificates > 0 || paidOrders.length > 0 || Boolean(manual?.tier);

  let tier: SnaraiTier | null = null;
  for (const level of SNARAI_TIER_THRESHOLDS) {
    if (certificates >= level.minCertificates) {
      tier = level.tier;
      break;
    }
  }

  // Una concesión manual de nivel manda sobre el conteo (caso del fundador invitado).
  if (manual?.tier) {
    const manualIndex = SNARAI_TIER_THRESHOLDS.findIndex((l) => l.tier === manual.tier);
    const computedIndex = tier ? SNARAI_TIER_THRESHOLDS.findIndex((l) => l.tier === tier) : Number.POSITIVE_INFINITY;
    if (manualIndex >= 0 && manualIndex < computedIndex) tier = manual.tier;
  }

  const parts: string[] = [];
  if (paidOrders.length > 0) parts.push(`${paidOrders.length} orden(es) pagada(s)`);
  if (paidCertificates > 0) parts.push(`${paidCertificates} certificados en órdenes`);
  if (minted > 0) parts.push(`${minted} emitidos`);
  if (manual?.certificates) parts.push(`${manual.certificates} por concesión`);
  if (manual?.tier) parts.push(`nivel ${manual.tier} por concesión`);

  return {
    isParticipant,
    certificates,
    tier,
    reason: parts.length > 0 ? parts.join(' + ') : 'sin compras, emisiones ni concesiones registradas',
  };
}

/** Roles de Discord que corresponden a un resultado de membresía. */
export function rolesForMembership(
  result: MembershipResult,
  roles: { verified: string; explorer: string; resident: string; institutional: string; riviera: string },
): string[] {
  if (!result.isParticipant) return [];
  const out = new Set<string>();
  if (roles.verified) out.add(roles.verified);

  const tierRole =
    result.tier === 'RIVIERA' ? roles.riviera :
    result.tier === 'INSTITUTIONAL' ? roles.institutional :
    result.tier === 'RESIDENT' ? roles.resident :
    result.tier === 'EXPLORER' ? roles.explorer :
    '';

  if (tierRole) out.add(tierRole);
  return [...out];
}

/** Todos los roles gestionados por el bot (para limpiar los que ya no aplican). */
export function allManagedRoles(roles: { verified: string; explorer: string; resident: string; institutional: string; riviera: string }): string[] {
  return [roles.verified, roles.explorer, roles.resident, roles.institutional, roles.riviera].filter(Boolean);
}
