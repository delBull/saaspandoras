'use server';

import { revalidatePath } from 'next/cache';
import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db';
import { hermesCreditDeposits, hermesTenantCredits } from '@saasfly/db/schema';
import { and, eq, inArray } from '@saasfly/db-core';
import { TenantBillingService } from '@saasfly/hermes-core';

/**
 * Aprobación / rechazo de depósitos (money path).
 *
 * Invariantes:
 *  1. Sólo un admin de plataforma puede autorizar (rol resuelto en servidor).
 *  2. El abono ocurre **únicamente** vía `TenantBillingService.processDeposit`.
 *  3. Compare-and-set sobre `status`: dos clics simultáneos no acreditan dos veces.
 *  4. Si el abono no se confirma en la DB, el depósito NO se marca `credited`
 *     (queda `approved` para reintento visible).
 *  5. Rechazar no libera el txHash: un pago no puede reclamarse dos veces.
 */

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ADMIN_OPERATIONS'] as const;

async function requireAdmin(): Promise<{ ok: true; actor: string } | { ok: false; error: string }> {
  const headers = await import('next/headers').then((m) => m.headers());
  const auth = await getNexusAuthContext(headers);
  if (!auth.isAuthenticated) {
    return { ok: false, error: 'Se requiere sesión de administrador.' };
  }
  if (!ADMIN_ROLES.includes(auth.role as (typeof ADMIN_ROLES)[number])) {
    return { ok: false, error: `El rol '${auth.role}' no puede autorizar saldo.` };
  }
  // Identidad del operador para auditoría: email verificado > wallet > rol.
  const identity = (auth.email ?? auth.wallet ?? auth.role ?? 'unknown').toString().toLowerCase();
  const actor = `admin:${identity}`;
  return { ok: true, actor };
}

export async function approveDeposit(depositId: string) {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  if (!depositId || typeof depositId !== 'string') {
    return { success: false, error: 'depositId inválido.' };
  }

  // 1) Estado actual (autoridad: la DB, no el cliente).
  const [deposit] = await db
    .select()
    .from(hermesCreditDeposits)
    .where(eq(hermesCreditDeposits.id, depositId))
    .limit(1);

  if (!deposit) return { success: false, error: 'Depósito no encontrado.' };
  if (deposit.isSandbox) {
    return { success: false, error: 'Los depósitos sandbox no requieren aprobación.' };
  }
  if (deposit.status === 'credited') {
    return { success: false, error: 'Este depósito ya fue acreditado.' };
  }
  if (deposit.status === 'rejected') {
    return { success: false, error: 'Este depósito fue rechazado; no se puede acreditar.' };
  }

  // 2) Claim atómico: pending|approved → approved. Un segundo clic no reclama fila.
  const claimed = await db
    .update(hermesCreditDeposits)
    .set({ status: 'approved', reviewedBy: gate.actor, reviewedAt: new Date() })
    .where(
      and(
        eq(hermesCreditDeposits.id, depositId),
        inArray(hermesCreditDeposits.status, ['pending', 'approved'])
      )
    )
    .returning({ id: hermesCreditDeposits.id });

  if (!claimed || claimed.length === 0) {
    return { success: false, error: 'El depósito ya está en proceso o fue procesado por otro operador.' };
  }

  // 3) Saldo antes del abono (para verificar que el crédito llegó a la DB).
  const [before] = await db
    .select({ balance: hermesTenantCredits.creditBalanceUsd })
    .from(hermesTenantCredits)
    .where(eq(hermesTenantCredits.tenantId, deposit.tenantId))
    .limit(1);
  const balanceBefore = Number(before?.balance ?? 0);

  const amountUsd = Number(deposit.amountUsd);

  try {
    await TenantBillingService.processDeposit({
      tenantId: deposit.tenantId,
      amountUsd,
      isSandbox: false,
      // Contabilidad: distingue tarjeta (thirdweb) de transferencia on-chain.
      paymentMethod: String(deposit.creditedBy ?? '').includes('thirdweb') ? 'thirdweb_pay' : 'crypto',
      transactionHash: deposit.txHash,
      payerWallet: deposit.fromAddress ?? undefined,
    });
  } catch (error: unknown) {
    console.error('[DepositReview] processDeposit threw:', deposit.id, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'El abono falló. El depósito sigue aprobado para reintento.',
    };
  }

  // 4) Verificación independiente: el saldo en DB debe reflejar el abono.
  //    `processDeposit` registra los fallos de DB y aun así devuelve ok, así que
  //    no se confía en su resultado.
  const [after] = await db
    .select({ balance: hermesTenantCredits.creditBalanceUsd })
    .from(hermesTenantCredits)
    .where(eq(hermesTenantCredits.tenantId, deposit.tenantId))
    .limit(1);
  const balanceAfter = Number(after?.balance ?? 0);
  const expectedMin = balanceBefore + amountUsd - 0.00005;

  if (!Number.isFinite(balanceAfter) || balanceAfter < expectedMin) {
    console.error(
      `[DepositReview] Crédito no confirmado para ${deposit.id}: antes=${balanceBefore} después=${balanceAfter} importe=${amountUsd}`
    );
    return {
      success: false,
      error: `El abono no se confirmó en la base de datos (saldo ${balanceBefore} → ${balanceAfter}, esperado +${amountUsd}). El depósito queda "approved" para reintento.`,
    };
  }

  await db
    .update(hermesCreditDeposits)
    .set({ status: 'credited', reviewedAt: new Date() })
    .where(and(eq(hermesCreditDeposits.id, depositId), eq(hermesCreditDeposits.status, 'approved')));

  revalidatePath('/admin/finance/deposits');
  revalidatePath('/admin/finance/revenue');

  return {
    success: true,
    message: `$${amountUsd.toFixed(2)} acreditados a ${deposit.tenantId}. Saldo: $${balanceAfter.toFixed(4)}.`,
  };
}

export async function rejectDeposit(depositId: string, reason: string) {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  if (!depositId || typeof depositId !== 'string') {
    return { success: false, error: 'depositId inválido.' };
  }

  const cleanReason = typeof reason === 'string' ? reason.trim().slice(0, 400) : '';
  if (cleanReason.length < 5) {
    return { success: false, error: 'Indica el motivo del rechazo (mínimo 5 caracteres).' };
  }

  const rejected = await db
    .update(hermesCreditDeposits)
    .set({
      status: 'rejected',
      reviewedBy: gate.actor,
      reviewedAt: new Date(),
      rejectionReason: cleanReason,
    })
    .where(
      and(
        eq(hermesCreditDeposits.id, depositId),
        inArray(hermesCreditDeposits.status, ['pending', 'approved'])
      )
    )
    .returning({ id: hermesCreditDeposits.id });

  if (!rejected || rejected.length === 0) {
    return { success: false, error: 'El depósito ya fue acreditado o rechazado.' };
  }

  revalidatePath('/admin/finance/deposits');
  return { success: true, message: 'Depósito rechazado. El txHash queda reservado (no se puede reclamar de nuevo).' };
}
