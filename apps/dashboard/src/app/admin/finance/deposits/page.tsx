import React from 'react';
import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db';
import { hermesCreditDeposits } from '@saasfly/db/schema';
import { desc, inArray, eq, and } from '@saasfly/db-core';
import { AdminAccessGate } from '../../AdminAccessGate';
import { DepositReviewTable } from './DepositReviewTable';

export const dynamic = 'force-dynamic';

/**
 * /admin/finance/deposits
 *
 * Bandeja de aprobación de depósitos. Un pago verificado on-chain entra como
 * `pending` y NO acredita saldo hasta que un admin lo autoriza aquí.
 */
export default async function DepositReviewPage() {
  const headers = await import('next/headers').then((m) => m.headers());
  const auth = await getNexusAuthContext(await headers);

  const canReview = auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN' || auth.role === 'ADMIN_OPERATIONS';
  if (!auth.isAuthenticated || !canReview) {
    return (
      <AdminAccessGate
        reason={
          auth.isAuthenticated
            ? `Tu cuenta con rol '${auth.role}' no puede autorizar saldo.`
            : 'Se requiere sesión de administrador de plataforma.'
        }
      />
    );
  }

  const queue = await db
    .select({
      id: hermesCreditDeposits.id,
      tenantId: hermesCreditDeposits.tenantId,
      amountUsd: hermesCreditDeposits.amountUsd,
      txHash: hermesCreditDeposits.txHash,
      chainId: hermesCreditDeposits.chainId,
      fromAddress: hermesCreditDeposits.fromAddress,
      blockNumber: hermesCreditDeposits.blockNumber,
      status: hermesCreditDeposits.status,
      note: hermesCreditDeposits.note,
      reviewedBy: hermesCreditDeposits.reviewedBy,
      reviewedAt: hermesCreditDeposits.reviewedAt,
      rejectionReason: hermesCreditDeposits.rejectionReason,
      createdAt: hermesCreditDeposits.createdAt,
    })
    .from(hermesCreditDeposits)
    .where(inArray(hermesCreditDeposits.status, ['pending', 'approved']))
    .orderBy(desc(hermesCreditDeposits.createdAt))
    .limit(100);

  const recent = await db
    .select({
      id: hermesCreditDeposits.id,
      tenantId: hermesCreditDeposits.tenantId,
      amountUsd: hermesCreditDeposits.amountUsd,
      txHash: hermesCreditDeposits.txHash,
      chainId: hermesCreditDeposits.chainId,
      status: hermesCreditDeposits.status,
      reviewedBy: hermesCreditDeposits.reviewedBy,
      reviewedAt: hermesCreditDeposits.reviewedAt,
      rejectionReason: hermesCreditDeposits.rejectionReason,
      createdAt: hermesCreditDeposits.createdAt,
    })
    .from(hermesCreditDeposits)
    .where(and(inArray(hermesCreditDeposits.status, ['credited', 'rejected']), eq(hermesCreditDeposits.isSandbox, false)))
    .orderBy(desc(hermesCreditDeposits.reviewedAt))
    .limit(25);

  const rows = queue.map((row) => ({
    ...row,
    amountUsd: Number(row.amountUsd),
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
  }));

  const recentRows = recent.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Depósitos por autorizar</h1>
        <p className="text-sm text-zinc-400">
          Cada pago fue verificado on-chain (USDC → treasury). El saldo se acredita solo cuando lo autorizas.
        </p>
      </header>

      <DepositReviewTable rows={rows} recent={recentRows} />
    </div>
  );
}
