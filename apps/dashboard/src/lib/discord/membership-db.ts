/**
 * 🎭 Discord · resolución de membresía contra la base de datos
 *
 * Cadena de evidencia (sin inventar cantidades):
 *   wallet → `users.email` → `marketing_leads` → `commercial_orders` (org `snarai`, pagada)
 *   wallet → `tenant_nft_issuances` (proyecto S'Narai, emisión confirmada) → certificados
 *
 * Si la orden no registra cuántos certificados incluye, cuenta como acceso
 * (participante) pero no como nivel: el nivel se calcula con certificados
 * emitidos. Así nadie obtiene un rol alto por una cifra supuesta.
 */
import { db } from '@saasfly/db';
import { users, marketingLeads, commercialOrders, tenantNftIssuances } from '@saasfly/db/schema';
import { and, eq, inArray, sql } from '@saasfly/db-core';
import { resolveMembership, type MembershipResult } from './membership';

const SNARAI_SLUG = 'snarai';
const SNARAI_PROJECT_ID = 17;

export interface WalletMembership extends MembershipResult {
  wallet: string;
  email: string | null;
  paidOrders: number;
  mintedCertificates: number;
}

export async function resolveMembershipForWallet(walletAddress: string): Promise<WalletMembership> {
  const wallet = String(walletAddress || '').toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(wallet)) {
    return {
      wallet,
      email: null,
      paidOrders: 0,
      mintedCertificates: 0,
      isParticipant: false,
      certificates: 0,
      tier: null,
      reason: 'wallet inválida',
    };
  }

  // 1. Correo del usuario (para enlazar órdenes que viven por lead).
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.walletAddress, wallet))
    .limit(1);

  let paidOrders: Array<{ status: string }> = [];
  if (user?.email) {
    const leads = await db
      .select({ id: marketingLeads.id })
      .from(marketingLeads)
      .where(eq(marketingLeads.email, user.email.toLowerCase()))
      .limit(20);

    const leadIds = leads.map((l) => l.id).filter(Boolean);
    if (leadIds.length > 0) {
      paidOrders = await db
        .select({ status: commercialOrders.status })
        .from(commercialOrders)
        .where(and(
          inArray(commercialOrders.leadId, leadIds),
          eq(commercialOrders.requestedOrgSlug, SNARAI_SLUG),
        ))
        .limit(50);
    }
  }

  // 2. Certificados emitidos a la wallet (proyecto S'Narai).
  const [minted] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(tenantNftIssuances)
    .where(and(
      eq(tenantNftIssuances.projectId, SNARAI_PROJECT_ID),
      eq(tenantNftIssuances.recipientWallet, wallet),
      eq(tenantNftIssuances.status, 'minted'),
    ));

  const mintedCertificates = Number(minted?.total ?? 0);
  const result = resolveMembership({
    paidOrders: paidOrders.map((o) => ({ status: o.status })),
    mintedCertificates,
    manualGrant: null,
  });

  return {
    ...result,
    wallet,
    email: user?.email ?? null,
    paidOrders: paidOrders.filter((o) => /paid|verified|completed|settled/i.test(o.status)).length,
    mintedCertificates,
  };
}
