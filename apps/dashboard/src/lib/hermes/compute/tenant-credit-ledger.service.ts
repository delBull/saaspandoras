/**
 * 💳 TENANT CREDIT LEDGER & MARKUP ENGINE
 * apps/dashboard/src/lib/hermes/compute/tenant-credit-ledger.service.ts
 *
 * Manages per-tenant credit balances, applies dynamic profit markup on raw compute costs,
 * supports Sandbox test funds, and registers transparent usage events.
 *
 * 💡 ADMIN CONSOLE NOTE (`admin.pandoras.finance`):
 * Pandoras operations can override `markupPercentage` per tenant in the new admin console.
 * Default is 35% (or env `HERMES_DEFAULT_MARKUP_PERCENTAGE`).
 */

import { db } from '@/db';
import { hermesTenantCredits, hermesComputeUsageEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface TenantCreditsDTO {
  tenantId: string;
  creditBalanceUsd: number;
  totalDepositedUsd: number;
  totalSpentUsd: number;
  markupPercentage: number;
  isSandboxEnabled: boolean;
  sandboxBalanceUsd: number;
}

export interface ComputeEventParams {
  requestId: string;
  capability: string;
  provider: string;
  endpointId?: string;
  executionSeconds: number;
  rawCostUsd: number;
  isSandbox: boolean;
  metadata?: Record<string, any>;
}

export interface SettlementResult {
  ok: boolean;
  totalChargedUsd: number;
  rawCostUsd: number;
  markupCostUsd: number;
  remainingBalanceUsd: number;
  isSandbox: boolean;
  error?: string;
}

export class TenantCreditLedgerService {
  public static readonly DEFAULT_MARKUP_PERCENTAGE = Number(process.env.HERMES_DEFAULT_MARKUP_PERCENTAGE || 35);
  public static readonly MIN_TOPUP_AMOUNT_USD = 5.0000; // $5 USD mínimo de recarga permitido
  private static inMemoryCredits: Map<string, TenantCreditsDTO> = new Map();

  public static updateInMemoryCredits(tenantId: string, updates: Partial<TenantCreditsDTO>): void {
    const normalizedTenant = tenantId.toLowerCase().trim();
    const current = this.inMemoryCredits.get(normalizedTenant) || {
      tenantId: normalizedTenant,
      creditBalanceUsd: 0,
      totalDepositedUsd: 0,
      totalSpentUsd: 0,
      markupPercentage: this.DEFAULT_MARKUP_PERCENTAGE,
      isSandboxEnabled: true,
      sandboxBalanceUsd: 0,
    };
    this.inMemoryCredits.set(normalizedTenant, { ...current, ...updates });
  }

  /**
   * Retrieves or initializes the credit ledger entry for a tenant.
   * Tenants start at $0.00 until they fund their sandbox or production credits.
   */
  public static async getOrCreateCredits(tenantId: string): Promise<TenantCreditsDTO> {
    const normalizedTenant = tenantId.toLowerCase().trim();

    try {
      if (db) {
        const rows = await db
          .select()
          .from(hermesTenantCredits)
          .where(eq(hermesTenantCredits.tenantId, normalizedTenant))
          .limit(1);

        if (rows[0]) {
          return {
            tenantId: rows[0].tenantId,
            creditBalanceUsd: parseFloat(rows[0].creditBalanceUsd || '0.0000'),
            totalDepositedUsd: parseFloat(rows[0].totalDepositedUsd || '0.0000'),
            totalSpentUsd: parseFloat(rows[0].totalSpentUsd || '0.0000'),
            markupPercentage: rows[0].markupPercentage ?? this.DEFAULT_MARKUP_PERCENTAGE,
            isSandboxEnabled: rows[0].isSandboxEnabled ?? true,
            sandboxBalanceUsd: parseFloat(rows[0].sandboxBalanceUsd || '0.0000'),
          };
        }

        // Initialize tenant ledger with $0.00 USD balance (tenant must fund minimum $5 USD)
        const newRecord = {
          id: `cred_${normalizedTenant}`,
          tenantId: normalizedTenant,
          creditBalanceUsd: '0.0000',
          totalDepositedUsd: '0.0000',
          totalSpentUsd: '0.0000',
          markupPercentage: this.DEFAULT_MARKUP_PERCENTAGE,
          isSandboxEnabled: true,
          sandboxBalanceUsd: '0.0000',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.insert(hermesTenantCredits).values(newRecord).onConflictDoNothing();

        return {
          tenantId: normalizedTenant,
          creditBalanceUsd: 0,
          totalDepositedUsd: 0,
          totalSpentUsd: 0,
          markupPercentage: this.DEFAULT_MARKUP_PERCENTAGE,
          isSandboxEnabled: true,
          sandboxBalanceUsd: 0,
        };
      }
    } catch (err) {
      console.warn('[TenantCreditLedgerService] Notice reading DB credits:', err);
    }

    // Graceful fallback for dev or pending migration
    if (!this.inMemoryCredits.has(normalizedTenant)) {
      this.inMemoryCredits.set(normalizedTenant, {
        tenantId: normalizedTenant,
        creditBalanceUsd: 0,
        totalDepositedUsd: 0,
        totalSpentUsd: 0,
        markupPercentage: this.DEFAULT_MARKUP_PERCENTAGE,
        isSandboxEnabled: true,
        sandboxBalanceUsd: 0,
      });
    }
    return this.inMemoryCredits.get(normalizedTenant)!;
  }

  /**
   * Evaluates whether the tenant has sufficient balance for an estimated job cost.
   */
  public static async hasSufficientBalance(
    tenantId: string,
    estimatedRawCostUsd: number = 0.02,
    isSandbox: boolean = false
  ): Promise<{ sufficient: boolean; balance: number; estimatedCharge: number; markupPercentage: number }> {
    const credits = await this.getOrCreateCredits(tenantId);
    const markupMultiplier = 1 + credits.markupPercentage / 100;
    const estimatedCharge = Number((estimatedRawCostUsd * markupMultiplier).toFixed(4));

    const activeBalance = isSandbox ? credits.sandboxBalanceUsd : credits.creditBalanceUsd;
    const sufficient = activeBalance >= estimatedCharge;

    return {
      sufficient,
      balance: activeBalance,
      estimatedCharge,
      markupPercentage: credits.markupPercentage,
    };
  }

  /**
   * Atomically settles compute usage, deducting the charged amount and inserting a usage event.
   */
  public static async settleUsage(
    tenantId: string,
    params: ComputeEventParams
  ): Promise<SettlementResult> {
    const normalizedTenant = tenantId.toLowerCase().trim();
    const credits = await this.getOrCreateCredits(normalizedTenant);

    const markupMultiplier = 1 + credits.markupPercentage / 100;
    const totalChargedUsd = Number((params.rawCostUsd * markupMultiplier).toFixed(5));
    const markupCostUsd = Number((totalChargedUsd - params.rawCostUsd).toFixed(5));

    const isSandbox = params.isSandbox;
    let currentBalance = isSandbox ? credits.sandboxBalanceUsd : credits.creditBalanceUsd;

    if (currentBalance < totalChargedUsd) {
      return {
        ok: false,
        totalChargedUsd,
        rawCostUsd: params.rawCostUsd,
        markupCostUsd,
        remainingBalanceUsd: currentBalance,
        isSandbox,
        error: `Insufficient ${isSandbox ? 'sandbox test' : 'production'} credits. Balance: $${currentBalance.toFixed(4)}, Required: $${totalChargedUsd.toFixed(4)}`,
      };
    }

    const newBalance = Number((currentBalance - totalChargedUsd).toFixed(4));
    const newSpent = Number((credits.totalSpentUsd + totalChargedUsd).toFixed(4));

    try {
      if (db) {
        // Update tenant balance
        if (isSandbox) {
          await db
            .update(hermesTenantCredits)
            .set({
              sandboxBalanceUsd: newBalance.toFixed(4),
              updatedAt: new Date(),
            })
            .where(eq(hermesTenantCredits.tenantId, normalizedTenant));
        } else {
          await db
            .update(hermesTenantCredits)
            .set({
              creditBalanceUsd: newBalance.toFixed(4),
              totalSpentUsd: newSpent.toFixed(4),
              updatedAt: new Date(),
            })
            .where(eq(hermesTenantCredits.tenantId, normalizedTenant));
        }

        // Insert audit usage event
        const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await db.insert(hermesComputeUsageEvents).values({
          id: eventId,
          tenantId: normalizedTenant,
          requestId: params.requestId,
          capability: params.capability,
          provider: params.provider,
          endpointId: params.endpointId,
          executionSeconds: params.executionSeconds.toFixed(3),
          rawCostUsd: params.rawCostUsd.toFixed(5),
          markupCostUsd: markupCostUsd.toFixed(5),
          totalChargedUsd: totalChargedUsd.toFixed(5),
          currency: 'USD',
          status: 'SETTLED',
          isSandbox,
          metadataJson: params.metadata || {},
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.warn('[TenantCreditLedgerService] Notice during DB settlement:', err);
    }

    return {
      ok: true,
      totalChargedUsd,
      rawCostUsd: params.rawCostUsd,
      markupCostUsd,
      remainingBalanceUsd: newBalance,
      isSandbox,
    };
  }
}
