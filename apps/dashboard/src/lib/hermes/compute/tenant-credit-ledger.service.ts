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
import { eq, and, or, sql } from 'drizzle-orm';

export interface TenantCreditsDTO {
  tenantId: string;
  creditBalanceUsd: number;
  reservedBalanceUsd: number;
  totalDepositedUsd: number;
  totalSpentUsd: number;
  markupPercentage: number;
  isSandboxEnabled: boolean;
  sandboxBalanceUsd: number;
  sandboxReservedBalanceUsd: number;
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

export interface ReservationResult {
  ok: boolean;
  reservationId?: string;
  reservedAmountUsd?: number;
  rawCostUsd?: number;
  markupCostUsd?: number;
  availableBalanceUsd?: number;
  isSandbox?: boolean;
  error?: string;
}

export class TenantCreditLedgerService {
  public static readonly DEFAULT_MARKUP_PERCENTAGE = Number(process.env.HERMES_DEFAULT_MARKUP_PERCENTAGE || 35);
  public static readonly MIN_TOPUP_AMOUNT_USD = 5.0000; // $5 USD mínimo de recarga permitido
  private static inMemoryCredits: Map<string, TenantCreditsDTO> = new Map();
  private static inMemoryReservations: Map<string, {
    tenantId: string;
    requestId?: string;
    isSandbox: boolean;
    reservedAmountUsd: number;
    rawCostUsd: number;
    markupPercentage: number;
    status: 'RESERVED' | 'SETTLED' | 'RELEASED';
  }> = new Map();

  public static updateInMemoryCredits(tenantId: string, updates: Partial<TenantCreditsDTO>): void {
    const normalizedTenant = tenantId.toLowerCase().trim();
    const current = this.inMemoryCredits.get(normalizedTenant) || {
      tenantId: normalizedTenant,
      creditBalanceUsd: 0,
      reservedBalanceUsd: 0,
      totalDepositedUsd: 0,
      totalSpentUsd: 0,
      markupPercentage: this.DEFAULT_MARKUP_PERCENTAGE,
      isSandboxEnabled: true,
      sandboxBalanceUsd: 0,
      sandboxReservedBalanceUsd: 0,
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
            reservedBalanceUsd: parseFloat(rows[0].reservedBalanceUsd || '0.0000'),
            totalDepositedUsd: parseFloat(rows[0].totalDepositedUsd || '0.0000'),
            totalSpentUsd: parseFloat(rows[0].totalSpentUsd || '0.0000'),
            markupPercentage: rows[0].markupPercentage ?? this.DEFAULT_MARKUP_PERCENTAGE,
            isSandboxEnabled: rows[0].isSandboxEnabled ?? true,
            sandboxBalanceUsd: parseFloat(rows[0].sandboxBalanceUsd || '0.0000'),
            sandboxReservedBalanceUsd: parseFloat(rows[0].sandboxReservedBalanceUsd || '0.0000'),
          };
        }

        // Initialize tenant ledger with $0.00 USD balance
        const newRecord = {
          id: `cred_${normalizedTenant}`,
          tenantId: normalizedTenant,
          creditBalanceUsd: '0.0000',
          reservedBalanceUsd: '0.0000',
          totalDepositedUsd: '0.0000',
          totalSpentUsd: '0.0000',
          markupPercentage: this.DEFAULT_MARKUP_PERCENTAGE,
          isSandboxEnabled: true,
          sandboxBalanceUsd: '0.0000',
          sandboxReservedBalanceUsd: '0.0000',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.insert(hermesTenantCredits).values(newRecord).onConflictDoNothing();

        return {
          tenantId: normalizedTenant,
          creditBalanceUsd: 0,
          reservedBalanceUsd: 0,
          totalDepositedUsd: 0,
          totalSpentUsd: 0,
          markupPercentage: this.DEFAULT_MARKUP_PERCENTAGE,
          isSandboxEnabled: true,
          sandboxBalanceUsd: 0,
          sandboxReservedBalanceUsd: 0,
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
        reservedBalanceUsd: 0,
        totalDepositedUsd: 0,
        totalSpentUsd: 0,
        markupPercentage: this.DEFAULT_MARKUP_PERCENTAGE,
        isSandboxEnabled: true,
        sandboxBalanceUsd: 0,
        sandboxReservedBalanceUsd: 0,
      });
    }
    return this.inMemoryCredits.get(normalizedTenant)!;
  }

  /**
   * Evaluates whether the tenant has sufficient unreserved balance for an estimated job cost.
   */
  public static async hasSufficientBalance(
    tenantId: string,
    estimatedRawCostUsd: number = 0.02,
    isSandbox: boolean = false
  ): Promise<{ sufficient: boolean; balance: number; estimatedCharge: number; markupPercentage: number }> {
    const credits = await this.getOrCreateCredits(tenantId);
    const markupMultiplier = 1 + credits.markupPercentage / 100;
    const estimatedCharge = Number((estimatedRawCostUsd * markupMultiplier).toFixed(4));

    const totalBalance = isSandbox ? credits.sandboxBalanceUsd : credits.creditBalanceUsd;
    const reservedBalance = isSandbox ? credits.sandboxReservedBalanceUsd : credits.reservedBalanceUsd;
    const availableBalance = Number(Math.max(0, totalBalance - reservedBalance).toFixed(4));
    const sufficient = availableBalance >= estimatedCharge;

    return {
      sufficient,
      balance: availableBalance,
      estimatedCharge,
      markupPercentage: credits.markupPercentage,
    };
  }

  /**
   * F5-6: Atomically reserves estimated compute credits before GPU execution starts.
   * Prevents race conditions and overdraft when concurrent generation requests occur.
   */
  public static async reserveCredits(
    tenantId: string,
    params: {
      requestId: string;
      capability: string;
      provider: string;
      estimatedRawCostUsd?: number;
      isSandbox?: boolean;
    }
  ): Promise<ReservationResult> {
    const normalizedTenant = tenantId.toLowerCase().trim();
    const isSandbox = params.isSandbox ?? false;
    const rawCostUsd = params.estimatedRawCostUsd ?? 0.02;

    const credits = await this.getOrCreateCredits(normalizedTenant);
    const markupMultiplier = 1 + credits.markupPercentage / 100;
    const reservedAmountUsd = Number((rawCostUsd * markupMultiplier).toFixed(5));
    const markupCostUsd = Number((reservedAmountUsd - rawCostUsd).toFixed(5));
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // ── ATOMIC SQL RESERVATION (Zero Overdraft Invariant F5-6) ──
    if (db) {
      const balanceCol = isSandbox ? hermesTenantCredits.sandboxBalanceUsd : hermesTenantCredits.creditBalanceUsd;
      const reservedCol = isSandbox ? hermesTenantCredits.sandboxReservedBalanceUsd : hermesTenantCredits.reservedBalanceUsd;

      // Atomic UPDATE with conditional guard against overdrawing available balance
      const [updated] = await db
        .update(hermesTenantCredits)
        .set(
          isSandbox
            ? {
                sandboxReservedBalanceUsd: sql`(CAST(${hermesTenantCredits.sandboxReservedBalanceUsd} AS numeric) + ${reservedAmountUsd})::numeric(12, 4)`,
                updatedAt: new Date(),
              }
            : {
                reservedBalanceUsd: sql`(CAST(${hermesTenantCredits.reservedBalanceUsd} AS numeric) + ${reservedAmountUsd})::numeric(12, 4)`,
                updatedAt: new Date(),
              }
        )
        .where(
          and(
            eq(hermesTenantCredits.tenantId, normalizedTenant),
            sql`(CAST(${balanceCol} AS numeric) - CAST(${reservedCol} AS numeric)) >= ${reservedAmountUsd}`
          )
        )
        .returning();

      if (!updated) {
        // Atomic lock prevented overdraft: available balance was insufficient
        const totalBal = isSandbox ? credits.sandboxBalanceUsd : credits.creditBalanceUsd;
        const curRes = isSandbox ? credits.sandboxReservedBalanceUsd : credits.reservedBalanceUsd;
        const available = Math.max(0, Number((totalBal - curRes).toFixed(4)));
        return {
          ok: false,
          error: `Saldo insuficiente para reservar cómputo. Saldo disponible: $${available.toFixed(4)} USD, requerido: $${reservedAmountUsd.toFixed(4)} USD.`,
          availableBalanceUsd: available,
          isSandbox,
        };
      }

      // Record reservation event in DB for durable recovery across serverless instances
      try {
        await db.insert(hermesComputeUsageEvents).values({
          id: reservationId,
          tenantId: normalizedTenant,
          requestId: params.requestId,
          capability: params.capability,
          provider: params.provider,
          executionSeconds: "0.000",
          rawCostUsd: rawCostUsd.toFixed(5),
          markupCostUsd: markupCostUsd.toFixed(5),
          totalChargedUsd: reservedAmountUsd.toFixed(5),
          currency: 'USD',
          status: 'RESERVED',
          isSandbox,
          metadataJson: { action: 'CREDIT_RESERVED', estimatedRawCostUsd: rawCostUsd },
          createdAt: new Date(),
        });
      } catch (insertErr) {
        console.warn('[TenantCreditLedgerService] Notice inserting reservation event:', insertErr);
      }
    } else {
      // In-memory fallback if DB not connected (tests)
      const totalBalance = isSandbox ? credits.sandboxBalanceUsd : credits.creditBalanceUsd;
      const currentReserved = isSandbox ? credits.sandboxReservedBalanceUsd : credits.reservedBalanceUsd;
      const availableBalance = Number((totalBalance - currentReserved).toFixed(4));

      if (availableBalance < reservedAmountUsd) {
        return {
          ok: false,
          error: `Saldo insuficiente para reservar cómputo. Saldo disponible: $${availableBalance.toFixed(4)} USD, requerido: $${reservedAmountUsd.toFixed(4)} USD.`,
          availableBalanceUsd: availableBalance,
          isSandbox,
        };
      }
    }

    // Keep fast local cache in sync
    const currentRes = isSandbox ? credits.sandboxReservedBalanceUsd : credits.reservedBalanceUsd;
    const newReserved = Number((currentRes + reservedAmountUsd).toFixed(4));
    this.inMemoryReservations.set(reservationId, {
      tenantId: normalizedTenant,
      requestId: params.requestId,
      isSandbox,
      reservedAmountUsd,
      rawCostUsd,
      markupPercentage: credits.markupPercentage,
      status: 'RESERVED',
    });
    this.updateInMemoryCredits(normalizedTenant, {
      [isSandbox ? 'sandboxReservedBalanceUsd' : 'reservedBalanceUsd']: newReserved,
    });

    const totBal = isSandbox ? credits.sandboxBalanceUsd : credits.creditBalanceUsd;
    return {
      ok: true,
      reservationId,
      reservedAmountUsd,
      rawCostUsd,
      markupCostUsd,
      availableBalanceUsd: Number(Math.max(0, totBal - newReserved).toFixed(4)),
      isSandbox,
    };
  }

  /**
   * Finds an active reservation by reservationId or requestId, in memory or DB.
   */
  public static async findActiveReservation(
    tenantId: string,
    idOrRequestId: string
  ): Promise<{ reservationId: string; reservedAmountUsd: number; isSandbox: boolean } | null> {
    const normalizedTenant = tenantId.toLowerCase().trim();
    const inMem = this.inMemoryReservations.get(idOrRequestId);
    if (inMem && inMem.tenantId === normalizedTenant && inMem.status === 'RESERVED') {
      return { reservationId: idOrRequestId, reservedAmountUsd: inMem.reservedAmountUsd, isSandbox: inMem.isSandbox };
    }

    const inMemByReq = [...this.inMemoryReservations.entries()].find(
      ([_, v]) => v.tenantId === normalizedTenant && v.requestId === idOrRequestId && v.status === 'RESERVED'
    );
    if (inMemByReq) {
      return { reservationId: inMemByReq[0], reservedAmountUsd: inMemByReq[1].reservedAmountUsd, isSandbox: inMemByReq[1].isSandbox };
    }

    if (db) {
      try {
        const [dbEvent] = await db
          .select()
          .from(hermesComputeUsageEvents)
          .where(
            and(
              eq(hermesComputeUsageEvents.tenantId, normalizedTenant),
              or(
                eq(hermesComputeUsageEvents.id, idOrRequestId),
                eq(hermesComputeUsageEvents.requestId, idOrRequestId)
              ),
              eq(hermesComputeUsageEvents.status, 'RESERVED')
            )
          )
          .limit(1);

        if (dbEvent) {
          return {
            reservationId: dbEvent.id,
            reservedAmountUsd: parseFloat(dbEvent.totalChargedUsd || '0'),
            isSandbox: dbEvent.isSandbox ?? false,
          };
        }
      } catch (err) {
        console.warn('[TenantCreditLedgerService] Notice looking up active reservation:', err);
      }
    }

    return null;
  }

  /**
   * F5-6 & F5-7: Atomically settles a prior reservation with the actual GPU compute seconds.
   * Performs 3-way financial audit: rawCostUsd + markupCostUsd = totalChargedUsd.
   * Releases the reserved lock and deducts actual charge from real balance.
   */
  public static async settleReservation(params: {
    reservationId: string;
    actualExecutionSeconds: number;
    actualRawCostUsd: number;
    tenantId: string;
    endpointId?: string;
  }): Promise<SettlementResult> {
    const normalizedTenant = params.tenantId.toLowerCase().trim();
    const credits = await this.getOrCreateCredits(normalizedTenant);
    let resolvedReservationId = params.reservationId;
    let reservation = this.inMemoryReservations.get(params.reservationId);

    // Fallback: search in-memory by requestId
    if (!reservation) {
      const entry = [...this.inMemoryReservations.entries()].find(
        ([_, v]) => v.tenantId === normalizedTenant && v.requestId === params.reservationId && v.status === 'RESERVED'
      );
      if (entry) {
        resolvedReservationId = entry[0];
        reservation = entry[1];
      }
    }

    // Multi-instance / Serverless DB Fallback: Recover reservation from DB if missing in local memory
    if (!reservation && db) {
      try {
        const [dbEvent] = await db
          .select()
          .from(hermesComputeUsageEvents)
          .where(
            and(
              eq(hermesComputeUsageEvents.tenantId, normalizedTenant),
              or(
                eq(hermesComputeUsageEvents.id, params.reservationId),
                eq(hermesComputeUsageEvents.requestId, params.reservationId)
              ),
              eq(hermesComputeUsageEvents.status, 'RESERVED')
            )
          )
          .limit(1);
        if (dbEvent) {
          resolvedReservationId = dbEvent.id;
          reservation = {
            tenantId: dbEvent.tenantId,
            requestId: dbEvent.requestId || params.reservationId,
            isSandbox: dbEvent.isSandbox ?? false,
            reservedAmountUsd: parseFloat(dbEvent.totalChargedUsd || '0'),
            rawCostUsd: parseFloat(dbEvent.rawCostUsd || '0'),
            markupPercentage: credits.markupPercentage,
            status: dbEvent.status as any,
          };
        }
      } catch (fetchErr) {
        console.warn('[TenantCreditLedgerService] Notice fetching DB reservation:', fetchErr);
      }
    }

    const isSandbox = reservation?.isSandbox ?? false;
    const reservedAmount = reservation?.reservedAmountUsd ?? 0;

    const markupMultiplier = 1 + credits.markupPercentage / 100;
    const totalChargedUsd = Number((params.actualRawCostUsd * markupMultiplier).toFixed(5));
    const markupCostUsd = Number((totalChargedUsd - params.actualRawCostUsd).toFixed(5));

    const totalBalance = isSandbox ? credits.sandboxBalanceUsd : credits.creditBalanceUsd;
    const currentReserved = isSandbox ? credits.sandboxReservedBalanceUsd : credits.reservedBalanceUsd;

    const newBalance = Number(Math.max(0, totalBalance - totalChargedUsd).toFixed(4));
    const newReserved = Number(Math.max(0, currentReserved - reservedAmount).toFixed(4));
    const newSpent = Number((credits.totalSpentUsd + totalChargedUsd).toFixed(4));

    if (reservation) {
      reservation.status = 'SETTLED';
    }
    this.updateInMemoryCredits(normalizedTenant, {
      [isSandbox ? 'sandboxBalanceUsd' : 'creditBalanceUsd']: newBalance,
      [isSandbox ? 'sandboxReservedBalanceUsd' : 'reservedBalanceUsd']: newReserved,
      totalSpentUsd: newSpent,
    });

    try {
      if (db) {
        // Atomic SQL balance update and reservation release
        if (isSandbox) {
          await db
            .update(hermesTenantCredits)
            .set({
              sandboxBalanceUsd: sql`GREATEST(0, (CAST(${hermesTenantCredits.sandboxBalanceUsd} AS numeric) - ${totalChargedUsd}))::numeric(12, 4)`,
              sandboxReservedBalanceUsd: sql`GREATEST(0, (CAST(${hermesTenantCredits.sandboxReservedBalanceUsd} AS numeric) - ${reservedAmount}))::numeric(12, 4)`,
              updatedAt: new Date(),
            })
            .where(eq(hermesTenantCredits.tenantId, normalizedTenant));
        } else {
          await db
            .update(hermesTenantCredits)
            .set({
              creditBalanceUsd: sql`GREATEST(0, (CAST(${hermesTenantCredits.creditBalanceUsd} AS numeric) - ${totalChargedUsd}))::numeric(12, 4)`,
              reservedBalanceUsd: sql`GREATEST(0, (CAST(${hermesTenantCredits.reservedBalanceUsd} AS numeric) - ${reservedAmount}))::numeric(12, 4)`,
              totalSpentUsd: sql`(CAST(${hermesTenantCredits.totalSpentUsd} AS numeric) + ${totalChargedUsd})::numeric(12, 4)`,
              updatedAt: new Date(),
            })
            .where(eq(hermesTenantCredits.tenantId, normalizedTenant));
        }

        // Update usage event to SETTLED with 3-way financial audit (F5-7)
        await db
          .update(hermesComputeUsageEvents)
          .set({
            status: 'SETTLED',
            endpointId: params.endpointId,
            executionSeconds: params.actualExecutionSeconds.toFixed(3),
            rawCostUsd: params.actualRawCostUsd.toFixed(5),
            markupCostUsd: markupCostUsd.toFixed(5),
            totalChargedUsd: totalChargedUsd.toFixed(5),
          })
          .where(eq(hermesComputeUsageEvents.id, resolvedReservationId));
      }
    } catch (err) {
      console.warn('[TenantCreditLedgerService] Notice during settlement update:', err);
    }

    return {
      ok: true,
      totalChargedUsd,
      rawCostUsd: params.actualRawCostUsd,
      markupCostUsd,
      remainingBalanceUsd: newBalance,
      isSandbox,
    };
  }

  /**
   * F5-6: Releases a credit reservation without charges (e.g. if generation failed before GPU execution).
   */
  public static async releaseReservation(
    reservationId: string,
    tenantId: string,
    reason?: string
  ): Promise<void> {
    const normalizedTenant = tenantId.toLowerCase().trim();
    let resolvedReservationId = reservationId;
    let reservation = this.inMemoryReservations.get(reservationId);

    // In-memory fallback: search by requestId
    if (!reservation) {
      const entry = [...this.inMemoryReservations.entries()].find(
        ([_, v]) => v.tenantId === normalizedTenant && v.requestId === reservationId && v.status === 'RESERVED'
      );
      if (entry) {
        resolvedReservationId = entry[0];
        reservation = entry[1];
      }
    }

    // Multi-instance / Serverless DB Fallback
    if (!reservation && db) {
      try {
        const [dbEvent] = await db
          .select()
          .from(hermesComputeUsageEvents)
          .where(
            and(
              eq(hermesComputeUsageEvents.tenantId, normalizedTenant),
              or(
                eq(hermesComputeUsageEvents.id, reservationId),
                eq(hermesComputeUsageEvents.requestId, reservationId)
              ),
              eq(hermesComputeUsageEvents.status, 'RESERVED')
            )
          )
          .limit(1);
        if (dbEvent) {
          resolvedReservationId = dbEvent.id;
          reservation = {
            tenantId: dbEvent.tenantId,
            requestId: dbEvent.requestId || reservationId,
            isSandbox: dbEvent.isSandbox ?? false,
            reservedAmountUsd: parseFloat(dbEvent.totalChargedUsd || '0'),
            rawCostUsd: parseFloat(dbEvent.rawCostUsd || '0'),
            markupPercentage: 35,
            status: dbEvent.status as any,
          };
        }
      } catch (fetchErr) {
        console.warn('[TenantCreditLedgerService] Notice fetching DB reservation for release:', fetchErr);
      }
    }

    if (!reservation || reservation.status !== 'RESERVED') return;

    reservation.status = 'RELEASED';
    const isSandbox = reservation.isSandbox;
    const reservedAmount = reservation.reservedAmountUsd;

    const credits = await this.getOrCreateCredits(normalizedTenant);
    const currentReserved = isSandbox ? credits.sandboxReservedBalanceUsd : credits.reservedBalanceUsd;
    const newReserved = Number(Math.max(0, currentReserved - reservedAmount).toFixed(4));

    this.updateInMemoryCredits(normalizedTenant, {
      [isSandbox ? 'sandboxReservedBalanceUsd' : 'reservedBalanceUsd']: newReserved,
    });

    try {
      if (db && reservedAmount > 0) {
        if (isSandbox) {
          await db
            .update(hermesTenantCredits)
            .set({
              sandboxReservedBalanceUsd: sql`GREATEST(0, (CAST(${hermesTenantCredits.sandboxReservedBalanceUsd} AS numeric) - ${reservedAmount}))::numeric(12, 4)`,
              updatedAt: new Date(),
            })
            .where(eq(hermesTenantCredits.tenantId, normalizedTenant));
        } else {
          await db
            .update(hermesTenantCredits)
            .set({
              reservedBalanceUsd: sql`GREATEST(0, (CAST(${hermesTenantCredits.reservedBalanceUsd} AS numeric) - ${reservedAmount}))::numeric(12, 4)`,
              updatedAt: new Date(),
            })
            .where(eq(hermesTenantCredits.tenantId, normalizedTenant));
        }

        await db
          .update(hermesComputeUsageEvents)
          .set({
            status: 'RELEASED',
            metadataJson: { action: 'RESERVATION_RELEASED', reason: reason || 'Execution cancelled or failed pre-GPU' },
          })
          .where(eq(hermesComputeUsageEvents.id, resolvedReservationId));
      }
    } catch (err) {
      console.warn('[TenantCreditLedgerService] Notice during reservation release:', err);
    }
  }


  /**
   * Atomically settles compute usage directly (backwards compatibility).
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
