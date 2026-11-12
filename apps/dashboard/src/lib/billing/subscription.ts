import { db } from '@saasfly/db';
import { installedProducts, projects, tenantSubscriptions } from '@saasfly/db/schema';
import { eq } from '@saasfly/db-core';
import { PRODUCT_REGISTRY } from '@saasfly/shared';
import { createTenantNotification } from '@/lib/notifications/tenant-notifications';

/**
 * Suscripción mensual del tenant (acceso a los productos instalados).
 *
 * Decisiones de negocio (2026-11-12):
 *  - El fee es la SUMA de los precios de los productos instalados (paquetes del
 *    PRODUCT_REGISTRY). Nivel: starter por defecto; growth si el producto está
 *    en ese plan; enterprise = precio custom (0 en la tabla, se pacta).
 *  - Es INDEPENDIENTE de los créditos de media (esos siguen por consumo).
 *  - Impago ⇒ 7 días de gracia ⇒ suspensión (solo lectura).
 */

export const BILLING_PERIOD_DAYS = 30;
export const GRACE_DAYS = 7;

export interface ProductLine {
  product: string;
  plan: string;
  tier: 'starter' | 'growth' | 'enterprise';
  priceUsd: number;
}

export interface MonthlyFee {
  totalUsd: number;
  lines: ProductLine[];
}

function tierForPlan(plan: string): 'starter' | 'growth' | 'enterprise' {
  const p = (plan ?? '').toLowerCase();
  if (p === 'enterprise') return 'enterprise';
  if (p === 'growth' || p === 'pro') return 'growth';
  return 'starter'; // trial/sandbox/starter → entrada
}

function priceFor(product: string, tier: 'starter' | 'growth' | 'enterprise'): number {
  const def = (PRODUCT_REGISTRY as Record<string, any>)[product];
  if (!def?.pricing) return 0;
  if (tier === 'enterprise') {
    const price = def.pricing.enterprise?.price;
    return typeof price === 'number' ? price : 0; // custom ⇒ se pacta
  }
  const price = def.pricing[tier]?.price;
  return typeof price === 'number' ? price : 0;
}

/** Fee mensual a partir de los productos instalados (puro, testeable). */
export function monthlyFeeForProducts(products: Array<{ product: string; plan?: string | null }>): MonthlyFee {
  const lines: ProductLine[] = [];
  for (const item of products) {
    const product = (item.product ?? '').toUpperCase();
    if (!product) continue;
    const tier = tierForPlan(item.plan ?? 'starter');
    const priceUsd = priceFor(product, tier);
    lines.push({ product, plan: item.plan ?? 'starter', tier, priceUsd });
  }
  const totalUsd = Number(lines.reduce((sum, l) => sum + l.priceUsd, 0).toFixed(2));
  return { totalUsd, lines };
}

export type SubscriptionStatus = 'active' | 'grace' | 'suspended' | 'canceled';

export interface SubscriptionState {
  status: SubscriptionStatus;
  /** Días hasta el próximo cargo (si está al día). */
  daysToCharge: number | null;
  /** Días de gracia restantes (si está en gracia). */
  graceDaysLeft: number | null;
  isReadOnly: boolean;
}

/** Máquina de estados de la suscripción (puro, testeable). */
export function computeSubscriptionState(
  sub: {
    status?: string | null;
    currentPeriodEnd?: Date | string | null;
    graceEndsAt?: Date | string | null;
  },
  now: Date = new Date()
): SubscriptionState {
  const status = (sub.status ?? 'active') as SubscriptionStatus;
  if (status === 'canceled') {
    return { status: 'canceled', daysToCharge: null, graceDaysLeft: null, isReadOnly: true };
  }

  const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
  if (!periodEnd || Number.isNaN(periodEnd.getTime())) {
    // Sin periodo configurado: no se suspende (nadie debe quedar fuera por datos faltantes).
    return { status: 'active', daysToCharge: null, graceDaysLeft: null, isReadOnly: false };
  }

  const day = 86_400_000;
  const toPeriodEnd = periodEnd.getTime() - now.getTime();

  if (toPeriodEnd >= 0) {
    return {
      status: 'active',
      daysToCharge: Math.ceil(toPeriodEnd / day),
      graceDaysLeft: null,
      isReadOnly: false,
    };
  }

  const graceEnd = sub.graceEndsAt ? new Date(sub.graceEndsAt) : null;
  if (graceEnd && !Number.isNaN(graceEnd.getTime()) && graceEnd.getTime() >= now.getTime()) {
    return {
      status: 'grace',
      daysToCharge: 0,
      graceDaysLeft: Math.ceil((graceEnd.getTime() - now.getTime()) / day),
      isReadOnly: false,
    };
  }

  return { status: 'suspended', daysToCharge: 0, graceDaysLeft: 0, isReadOnly: true };
}

async function loadProductsForTenant(tenantId: string) {
  const [project] = await db
    .select({ id: projects.id, slug: projects.slug })
    .from(projects)
    .where(eq(projects.slug, tenantId))
    .limit(1);
  if (!project) return [];

  return db
    .select({ product: installedProducts.product, plan: installedProducts.plan })
    .from(installedProducts)
    .where(eq(installedProducts.projectId, project.id));
}

export interface SubscriptionSnapshot {
  tenantId: string;
  status: SubscriptionStatus;
  amountUsd: number;
  lines: ProductLine[];
  currentPeriodEnd: Date | null;
  graceEndsAt: Date | null;
  lastPaymentTx: string | null;
  state: SubscriptionState;
}

/** Lee (o crea) la suscripción del tenant, recalculando el fee de sus productos. */
export async function getOrCreateSubscription(tenantId: string): Promise<SubscriptionSnapshot | null> {
  const normalized = tenantId.toLowerCase().trim();
  if (!db || !normalized) return null;

  const products = await loadProductsForTenant(normalized);
  const fee = monthlyFeeForProducts(products);
  const now = new Date();

  const [existing] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, normalized))
    .limit(1);

  if (!existing) {
    await db.insert(tenantSubscriptions).values({
      tenantId: normalized,
      status: 'active',
      amountUsd: fee.totalUsd.toFixed(2),
      currency: 'USD',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + BILLING_PERIOD_DAYS * 86_400_000),
      updatedAt: now,
    });
  } else if (Number(existing.amountUsd) !== fee.totalUsd) {
    // El fee cambia si cambian los productos/planes instalados.
    await db
      .update(tenantSubscriptions)
      .set({ amountUsd: fee.totalUsd.toFixed(2), updatedAt: now })
      .where(eq(tenantSubscriptions.tenantId, normalized));
  }

  const [row] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, normalized))
    .limit(1);

  if (!row) return null;

  return {
    tenantId: normalized,
    status: row.status as SubscriptionStatus,
    amountUsd: Number(row.amountUsd),
    lines: fee.lines,
    currentPeriodEnd: row.currentPeriodEnd ?? null,
    graceEndsAt: row.graceEndsAt ?? null,
    lastPaymentTx: row.lastPaymentTx ?? null,
    state: computeSubscriptionState(row, now),
  };
}

/**
 * Marca la suscripción como pagada por 30 días.
 * Idempotente por txHash. Devuelve `alreadyPaid` si el mismo pago se repite.
 */
export async function markSubscriptionPaid(params: {
  tenantId: string;
  txHash: string;
  amountUsd: number;
  paidAt?: Date;
}): Promise<{ ok: boolean; alreadyPaid?: boolean; reason?: string; snapshot?: SubscriptionSnapshot }> {
  const normalized = params.tenantId.toLowerCase().trim();
  const current = await getOrCreateSubscription(normalized);
  if (!current) return { ok: false, reason: 'SUBSCRIPTION_NOT_FOUND' };

  if (current.lastPaymentTx && current.lastPaymentTx.toLowerCase() === params.txHash.toLowerCase()) {
    return { ok: true, alreadyPaid: true, snapshot: current };
  }

  // Tolerancia de 1 centavo por redondeo on-chain.
  if (params.amountUsd + 0.01 < current.amountUsd) {
    return { ok: false, reason: 'AMOUNT_BELOW_PLAN_FEE' };
  }

  const paidAt = params.paidAt ?? new Date();
  await db
    .update(tenantSubscriptions)
    .set({
      status: 'active',
      currentPeriodStart: paidAt,
      currentPeriodEnd: new Date(paidAt.getTime() + BILLING_PERIOD_DAYS * 86_400_000),
      graceEndsAt: null,
      suspendedAt: null,
      lastPaymentTx: params.txHash.toLowerCase(),
      lastPaidAt: paidAt,
      lastPaidAmountUsd: params.amountUsd.toFixed(2),
      updatedAt: paidAt,
    })
    .where(eq(tenantSubscriptions.tenantId, normalized));

  const snapshot = await getOrCreateSubscription(normalized);
  return { ok: true, snapshot: snapshot ?? undefined };
}

/**
 * Aplica el ciclo de vida (activo → gracia → suspendido) y avisa al tenant.
 * Idempotente: los avisos usan dedupeKey por periodo.
 */
export async function applySubscriptionLifecycle(
  tenantId: string,
  now: Date = new Date()
): Promise<{ changed: boolean; status: SubscriptionStatus }> {
  const normalized = tenantId.toLowerCase().trim();
  const snapshot = await getOrCreateSubscription(normalized);
  if (!snapshot) return { changed: false, status: 'active' };

  const state = computeSubscriptionState(
    { status: snapshot.status, currentPeriodEnd: snapshot.currentPeriodEnd, graceEndsAt: snapshot.graceEndsAt },
    now
  );

  if (state.status === 'grace' && snapshot.status !== 'grace') {
    const graceEndsAt = new Date(now.getTime() + GRACE_DAYS * 86_400_000);
    await db
      .update(tenantSubscriptions)
      .set({ status: 'grace', graceEndsAt, updatedAt: now })
      .where(eq(tenantSubscriptions.tenantId, normalized));

    await createTenantNotification({
      tenantId: normalized,
      kind: 'SYSTEM',
      severity: 'warning',
      title: 'Tu plan está pendiente de pago',
      body: `Tienes ${GRACE_DAYS} días de gracia antes de pasar a solo lectura. Puedes pagar el plan desde Ajustes → Plan.`,
      link: `/portal/${normalized}/billing`,
      dedupeKey: `subscription:grace:${now.toISOString().slice(0, 10)}`,
    });
    return { changed: true, status: 'grace' };
  }

  if (state.status === 'suspended' && snapshot.status !== 'suspended') {
    await db
      .update(tenantSubscriptions)
      .set({ status: 'suspended', suspendedAt: now, updatedAt: now })
      .where(eq(tenantSubscriptions.tenantId, normalized));

    await createTenantNotification({
      tenantId: normalized,
      kind: 'SYSTEM',
      severity: 'critical',
      title: 'Cuenta en solo lectura',
      body: 'El periodo de gracia terminó. El portal queda en solo lectura hasta regularizar el plan (tus datos se conservan).',
      link: `/portal/${normalized}/billing`,
      dedupeKey: `subscription:suspended:${now.toISOString().slice(0, 10)}`,
    });
    return { changed: true, status: 'suspended' };
  }

  return { changed: false, status: state.status };
}
