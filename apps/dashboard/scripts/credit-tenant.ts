/**
 * Abona saldo (USD) al ledger de un tenant de Media Co.
 *
 * Es la operación de "inyectar saldo": suma a `credit_balance_usd` y a
 * `total_deposited_usd` en una sola transacción. No simula un pago: el respaldo
 * (SPEI/USDC) queda fuera y este comando es el asiento contable del ledger.
 *
 * Uso:
 *   DATABASE_URL=… bun apps/dashboard/scripts/credit-tenant.ts \
 *     --tenant forge --amount 50 --note "SPEI ref 123" --by ops:marco [--dry-run]
 *
 * Mínimo: $5.00 USD (mismo mínimo que aplica el servicio de facturación).
 */
import fs from 'fs';
import { db } from '@saasfly/db';
import { hermesTenantCredits } from '@saasfly/db/schema';
import { eq, sql } from '@saasfly/db-core';

const MIN_TOPUP_USD = 5;
const MAX_TOPUP_USD = 100_000;

function arg(name: string, fallback = ''): string {
  const idx = process.argv.indexOf(`--${name}`);
  const value = idx !== -1 ? process.argv[idx + 1] : undefined;
  return value && value.length > 0 ? value : fallback;
}

async function main() {
  const tenant = arg('tenant').toLowerCase().trim();
  const amountRaw = arg('amount');
  const note = arg('note', '').slice(0, 500);
  const actor = arg('by', 'ops:unknown');
  const dryRun = process.argv.includes('--dry-run');

  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  if (!tenant) throw new Error('--tenant is required.');

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount < MIN_TOPUP_USD || amount > MAX_TOPUP_USD) {
    throw new Error(`--amount must be a number between ${MIN_TOPUP_USD} and ${MAX_TOPUP_USD} USD.`);
  }
  const normalizedAmount = amount.toFixed(4);

  const [row] = await db
    .select({
      tenantId: hermesTenantCredits.tenantId,
      balance: hermesTenantCredits.creditBalanceUsd,
      reserved: hermesTenantCredits.reservedBalanceUsd,
      deposited: hermesTenantCredits.totalDepositedUsd,
    })
    .from(hermesTenantCredits)
    .where(eq(hermesTenantCredits.tenantId, tenant))
    .limit(1);

  if (!row) {
    throw new Error(`No credit ledger for tenant '${tenant}'. Provision the tenant first.`);
  }

  const newBalance = (Number(row.balance) + amount).toFixed(4);
  const newDeposited = (Number(row.deposited) + amount).toFixed(4);

  const receipt = {
    tenant,
    amountUsd: normalizedAmount,
    previousBalanceUsd: row.balance,
    newBalanceUsd: newBalance,
    reservedBalanceUsd: row.reserved,
    note: note || null,
    actor,
    at: new Date().toISOString(),
    dryRun,
  };

  if (dryRun) {
    console.log(JSON.stringify({ ok: true, ...receipt, applied: false }, null, 2));
    return;
  }

  await db
    .update(hermesTenantCredits)
    .set({
      creditBalanceUsd: sql`(CAST(${hermesTenantCredits.creditBalanceUsd} AS numeric) + ${normalizedAmount})::numeric(12, 4)`,
      totalDepositedUsd: sql`(CAST(${hermesTenantCredits.totalDepositedUsd} AS numeric) + ${normalizedAmount})::numeric(12, 4)`,
      updatedAt: new Date(),
    })
    .where(eq(hermesTenantCredits.tenantId, tenant));

  // Recibo local (el asiento contable del ledger es total_deposited_usd).
  try {
    fs.appendFileSync(
      `${process.env.HOME ?? '/tmp'}/.forge-credit-receipts.log`,
      `${JSON.stringify({ ...receipt, applied: true })}\n`,
      { mode: 0o600 }
    );
  } catch {
    /* el recibo es auxiliar: si falla, el abono ya está aplicado */
  }

  console.log(JSON.stringify({ ok: true, ...receipt, applied: true }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[credit-tenant] failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
