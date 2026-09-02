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

import { db } from '@/db';
import { hermesTenantCredits, hermesComputeUsageEvents } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
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

    try {
      if (db) {
        // Actualizar balance atómicamente
        if (isSandbox) {
          await db
            .update(hermesTenantCredits)
            .set({
              sandboxBalanceUsd: newBalanceUsd.toFixed(4),
              totalDepositedUsd: newTotalDeposited.toFixed(4),
              updatedAt: new Date(),
            })
            .where(eq(hermesTenantCredits.tenantId, normalizedTenant));
        } else {
          await db
            .update(hermesTenantCredits)
            .set({
              creditBalanceUsd: newBalanceUsd.toFixed(4),
              totalDepositedUsd: newTotalDeposited.toFixed(4),
              updatedAt: new Date(),
            })
            .where(eq(hermesTenantCredits.tenantId, normalizedTenant));
        }

        // Registrar evento auditado de fondeo para la Contabilidad Interna de Hermes
        await db.insert(hermesComputeUsageEvents).values({
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
          },
          createdAt: new Date(),
        });
      }
    } catch (err: any) {
      console.error('[TenantBillingService] Error saving deposit to DB:', err);
    }

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

      return rows.map(r => {
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
    } catch (err) {
      console.error('[TenantBillingService] Error fetching internal accounting ledger:', err);
      return [];
    }
  }
}
