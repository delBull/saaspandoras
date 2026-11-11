/**
 * 💳 HERMES TENANT BILLING & INTERNAL ACCOUNTING SERVICE
 * apps/dashboard/src/lib/hermes/compute/tenant-billing.service.ts
 *
 * Manages deposits, Thirdweb Pay settlements, and Hermes internal accounting ledger.
 *
 * ==============================================================================
 * 🏛️ ADMIN CONSOLE INTEGRATION NOTE #2: CONTABILIDAD INTERNA DE HERMES
 * ==============================================================================
 * Al construir la nueva consola en admin.pandoras.finance, este módulo debe
 * exponerse visualmente para auditoría de operaciones:
 * 1. Visualizador de ingresos brutos vs costos netos de RunPod.
 * 2. Comisiones retenidas y margen acumulado (35% o dinámico por tenant).
 * 3. Trazabilidad inmutable de sweeps hacia PANDORAS_ADMIN_WALLET con:
 *    - ¿Cuánto se transfirió? (amountUsd / markupCostUsd)
 *    - ¿A qué wallet? (destinationWallet)
 *    - ¿Cuándo? (timestamp ISO)
 *    - ¿Por qué? (motivo: recarga de créditos, consumo por evento, sweep periódico)
 * 4. Control de conciliación bancaria y on-chain (Thirdweb Pay + Crypto).
 * ==============================================================================
 */

import { db } from '@saasfly/db-core';
import { hermesTenantCredits, hermesComputeUsageEvents } from '@saasfly/db-core/schema';
import { and, desc, eq, sql } from "@saasfly/db-core";
import { TenantCreditLedgerService } from './tenant-credit-ledger.service';

export interface DepositRequest {
  tenantId: string;
  amountUsd: number;
  isSandbox?: boolean;
  paymentMethod?: 'thirdweb_pay' | 'crypto' | 'card' | 'manual';
  transactionHash?: string;
  payerWallet?: string;
}

export interface DepositResult {
  ok: boolean;
  depositId: string;
  tenantId: string;
  amountCreditedUsd: number;
  newBalanceUsd: number;
  isSandbox: boolean;
  platformCommissionUsd: number;
  treasuryWallet: string;
  message: string;
}

export interface HermesInternalAccountingEntry {
  id: string;
  timestamp: string;
  tenantId: string;
  eventType: string;
  amountUsd: number;
  rawCostUsd: number;
  markupCostUsd: number;
  destinationWallet: string;
  reason: string;
  status: string;
  isSandbox: boolean;
  transactionHash?: string;
  payerWallet?: string;
}

export class TenantBillingService {
  private static inMemoryLedger: any[] = [];

  /**
   * Pandoras Admin / Treasury Wallet resolution.
   * STRICT FAIL-CLOSED: Resolves exclusively from environment variables,
   * ZERO hardcoded private or personal wallets in codebase.
   */
  public static getTreasuryWallet(): string {
    const wallet =
      process.env.PANDORAS_ADMIN_WALLET ||
      process.env.PANDORAS_TREASURY_WALLET ||
      process.env.NEXT_PUBLIC_SWAP_FEE_WALLET;

    if (!wallet) {
      throw new Error(
        '[TenantBillingService] Ni PANDORAS_ADMIN_WALLET ni PANDORAS_TREASURY_WALLET están configuradas en las variables de entorno.'
      );
    }
    return wallet.trim();
  }

  /**
   * Acreditación de saldo a un tenant tras un pago exitoso con Thirdweb.
   */
  public static async processDeposit(req: DepositRequest): Promise<DepositResult> {
    const { tenantId, amountUsd, isSandbox = false, paymentMethod = 'thirdweb_pay', transactionHash, payerWallet } = req;
    const normalizedTenant = tenantId.toLowerCase().trim();

    if (amountUsd < TenantCreditLedgerService.MIN_TOPUP_AMOUNT_USD) {
      throw new Error(`El monto mínimo de recarga es de $${TenantCreditLedgerService.MIN_TOPUP_AMOUNT_USD.toFixed(2)} USD.`);
    }

    const currentCredits = await TenantCreditLedgerService.getOrCreateCredits(normalizedTenant);
    const depositId = `dep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const treasuryWallet = this.getTreasuryWallet();

    // Comisión calculada del margen (35% por defecto)
    const markupPct = currentCredits.markupPercentage;
    const platformCommissionUsd = parseFloat(((amountUsd * markupPct) / (100 + markupPct)).toFixed(4));
    const netComputeUsd = parseFloat((amountUsd - platformCommissionUsd).toFixed(4));

    let newBalanceUsd = 0;

    if (isSandbox) {
      newBalanceUsd = currentCredits.sandboxBalanceUsd + amountUsd;
    } else {
      newBalanceUsd = currentCredits.creditBalanceUsd + amountUsd;
    }

    const newTotalDeposited = currentCredits.totalDepositedUsd + amountUsd;

    // ── Persistencia (transaccional, atómica, idempotente) ────────────────────
    // Antes: read-modify-write + `catch { console.error }` → pérdida de abonos y
    // fallos silenciosos. Ahora: incremento atómico en SQL, eventos y saldo en la
    // misma transacción, y el error se propaga al llamador.
    if (db) {
      await db.transaction(async (tx: any) => {
        // 0) Bloqueo de la fila de saldo: serializa depósitos concurrentes del
        //    mismo tenant (evita el doble abono por carrera, no sólo por status).
        const [locked] = await tx
          .select({
            credit: hermesTenantCredits.creditBalanceUsd,
            sandbox: hermesTenantCredits.sandboxBalanceUsd,
          })
          .from(hermesTenantCredits)
          .where(eq(hermesTenantCredits.tenantId, normalizedTenant))
          .for('update')
          .limit(1);

        if (!locked) {
          throw new Error(
            `[TenantBillingService] El tenant '${normalizedTenant}' no existe en hermes_tenant_credits; no se acredita.`
          );
        }

        // 1) Idempotencia por pago: un mismo txHash no se acredita dos veces.
        if (!isSandbox && transactionHash) {
          const [already] = await tx
            .select({ id: hermesComputeUsageEvents.id })
            .from(hermesComputeUsageEvents)
            .where(
              and(
                eq(hermesComputeUsageEvents.capability, 'billing.credit.deposit'),
                sql`${hermesComputeUsageEvents.metadataJson}->>'transactionHash' = ${transactionHash}`
              )
            )
            .limit(1);

          if (already) {
            newBalanceUsd = Number(isSandbox ? locked.sandbox : locked.credit) || newBalanceUsd;
            return; // ya acreditado: no se vuelve a sumar
          }
        }

        // 2) Incremento atómico (`col = col + n`), sin leer-y-escribir.
        const balanceColumn = isSandbox
          ? hermesTenantCredits.sandboxBalanceUsd
          : hermesTenantCredits.creditBalanceUsd;

        const [updated] = await tx
          .update(hermesTenantCredits)
          .set({
            [isSandbox ? 'sandboxBalanceUsd' : 'creditBalanceUsd']: sql`${balanceColumn} + ${amountUsd}`,
            totalDepositedUsd: sql`${hermesTenantCredits.totalDepositedUsd} + ${amountUsd}`,
            updatedAt: new Date(),
          })
          .where(eq(hermesTenantCredits.tenantId, normalizedTenant))
          .returning({
            balance: balanceColumn,
            total: hermesTenantCredits.totalDepositedUsd,
          });

        if (!updated) {
          throw new Error(
            `[TenantBillingService] No se pudo acreditar el saldo: el tenant '${normalizedTenant}' no existe en hermes_tenant_credits.`
          );
        }

        newBalanceUsd = Number(updated.balance);
        const persistedTotal = Number(updated.total);

        // 3) Evento auditado de fondeo (misma transacción que el saldo).
        await tx.insert(hermesComputeUsageEvents).values({
          id: depositId,
          tenantId: normalizedTenant,
          requestId: depositId,
          capability: 'billing.credit.deposit',
          provider: paymentMethod,
          rawCostUsd: netComputeUsd.toFixed(5),
          markupCostUsd: platformCommissionUsd.toFixed(5),
          totalChargedUsd: amountUsd.toFixed(5),
          currency: 'USD',
          status: 'FUNDED',
          isSandbox,
          metadataJson: {
            depositId,
            transactionHash: transactionHash || null,
            payerWallet: payerWallet || null,
            destinationWallet: treasuryWallet,
            platformCommissionUsd,
            netComputeUsd,
            reason: `Fondeo de créditos ${isSandbox ? 'Sandbox (Pruebas)' : 'Producción'} con margen ${markupPct}%`,
            fundedAt: new Date().toISOString(),
            totalDepositedUsd: persistedTotal,
          },
          createdAt: new Date(),
        });
      });
    }

    // Always mirror to in-memory ledger for immediate audit resilience
    this.inMemoryLedger.unshift({
      id: depositId,
      timestamp: new Date().toISOString(),
      tenantId: normalizedTenant,
      eventType: 'billing.credit.deposit',
      amountUsd,
      rawCostUsd: netComputeUsd,
      markupCostUsd: platformCommissionUsd,
      destinationWallet: treasuryWallet,
      reason: `Fondeo de créditos ${isSandbox ? 'Sandbox (Pruebas)' : 'Producción'} con margen ${markupPct}%`,
      status: 'FUNDED',
      isSandbox,
      transactionHash: transactionHash || null,
      payerWallet: payerWallet || null,
    });

    // Always mirror to in-memory credit ledger
    TenantCreditLedgerService.updateInMemoryCredits(normalizedTenant, {
      sandboxBalanceUsd: isSandbox ? newBalanceUsd : currentCredits.sandboxBalanceUsd,
      creditBalanceUsd: !isSandbox ? newBalanceUsd : currentCredits.creditBalanceUsd,
      totalDepositedUsd: newTotalDeposited,
    });

    return {
      ok: true,
      depositId,
      tenantId: normalizedTenant,
      amountCreditedUsd: amountUsd,
      newBalanceUsd,
      isSandbox,
      platformCommissionUsd,
      treasuryWallet,
      message: `Recarga de $${amountUsd.toFixed(2)} USD acreditada exitosamente en ${
        isSandbox ? 'Saldo Sandbox (Pruebas)' : 'Créditos de Producción'
      }.`,
    };
  }

  /**
   * Consulta el libro mayor de Contabilidad Interna de Hermes.
   * Permite auditar exactamente qué se cobró, cuánto se transfirió, a qué wallet y por qué.
   */
  public static async getInternalAccountingLedger(options?: {
    tenantId?: string;
    limit?: number;
  }): Promise<HermesInternalAccountingEntry[]> {
    const limit = options?.limit || 100;

    try {
      if (!db) return [];

      let query = db
        .select()
        .from(hermesComputeUsageEvents)
        .orderBy(desc(hermesComputeUsageEvents.createdAt))
        .limit(limit);

      if (options?.tenantId) {
        query = db
          .select()
          .from(hermesComputeUsageEvents)
          .where(eq(hermesComputeUsageEvents.tenantId, options.tenantId.toLowerCase().trim()))
          .orderBy(desc(hermesComputeUsageEvents.createdAt))
          .limit(limit) as any;
      }

      const rows = await query;
      const treasury = this.getTreasuryWallet();

      const mapped = rows.map(r => {
        const meta = (r.metadataJson as Record<string, any>) || {};
        return {
          id: r.id,
          timestamp: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          tenantId: r.tenantId,
          eventType: r.capability,
          amountUsd: parseFloat(r.totalChargedUsd || '0'),
          rawCostUsd: parseFloat(r.rawCostUsd || '0'),
          markupCostUsd: parseFloat(r.markupCostUsd || '0'),
          destinationWallet: meta.destinationWallet || treasury,
          reason: meta.reason || (r.capability === 'billing.credit.deposit' ? 'Recarga de créditos' : 'Consumo GPU Serverless'),
          status: r.status || 'SETTLED',
          isSandbox: r.isSandbox,
          transactionHash: meta.transactionHash,
          payerWallet: meta.payerWallet,
        };
      });

      if (rows.length === 0 && this.inMemoryLedger.length > 0) {
        const tenantFilter = options?.tenantId ? options.tenantId.toLowerCase().trim() : null;
        return this.inMemoryLedger.filter(e => !tenantFilter || e.tenantId === tenantFilter);
      }

      return mapped;
    } catch (err) {
      console.warn('[TenantBillingService] Notice fetching DB accounting ledger, utilizing audit mirror:', err);
      const tenantFilter = options?.tenantId ? options.tenantId.toLowerCase().trim() : null;
      return this.inMemoryLedger.filter(e => !tenantFilter || e.tenantId === tenantFilter);
    }
  }
}
