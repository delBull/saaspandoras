import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Ledger de depósitos: atomicidad, idempotencia y errores visibles.
 *
 * Fallan si se revierte a read-modify-write o si se vuelve a tragar el error.
 */

const state = vi.hoisted(() => ({
  credits: { creditBalanceUsd: 0, sandboxBalanceUsd: 0, totalDepositedUsd: 0 },
  events: [] as Array<{ capability: string; transactionHash: string | null; id: string }>,
  failUpdate: false,
  rowExists: true,
}));

const { col } = vi.hoisted(() => ({ col: (name: string) => ({ __col: name }) }));

vi.mock('@saasfly/db-core', () => {
  const credits = {
    __table: 'hermes_tenant_credits',
    tenantId: col('tenantId'),
    creditBalanceUsd: col('creditBalanceUsd'),
    sandboxBalanceUsd: col('sandboxBalanceUsd'),
    totalDepositedUsd: col('totalDepositedUsd'),
  };
  const events = {
    __table: 'hermes_compute_usage_events',
    id: col('id'),
    capability: col('capability'),
    metadataJson: col('metadataJson'),
  };

  const sql = (strings: TemplateStringsArray, ...values: any[]) => ({
    __sql: true,
    text: strings.join('?'),
    values,
  });

  const eq = (c: any, value: any) => ({ kind: 'eq', col: c.__col, value });
  const and = (...parts: any[]) => ({ kind: 'and', parts });

  const matchEvent = (row: any, pred: any): boolean => {
    if (!pred) return true;
    if (pred.kind === 'and') return pred.parts.every((p: any) => matchEvent(row, p));
    if (pred.kind === 'eq') return row[pred.col] === pred.value;
    if (pred.__sql && String(pred.text).includes("transactionHash")) {
      return row.transactionHash === pred.values[1];
    }
    return true;
  };

  const tx = {
    select: () => ({
      from: (t: any) => ({
        where: (pred: any) => ({
          for: () => ({
            limit: async () => {
              if (t.__table === 'hermes_tenant_credits') {
                if (!state.rowExists) return [];
                return [{ ...state.credits }];
              }
              if (t.__table === 'hermes_compute_usage_events') {
                return state.events.filter((e) => matchEvent(e, pred));
              }
              return [];
            },
          }),
          limit: async () => {
            if (t.__table === 'hermes_compute_usage_events') {
              return state.events.filter((e) => matchEvent(e, pred));
            }
            return [];
          },
        }),
      }),
    }),
    update: () => ({
      set: (values: any) => ({
        where: () => ({
          returning: async () => {
            if (state.failUpdate) throw new Error('DB_WRITE_FAILED');
            if (!state.rowExists) return [];
            for (const [key, value] of Object.entries(values)) {
              if (value && typeof value === 'object' && (value as any).__sql) {
                const amount = Number((value as any).values[1]);
                if (key === 'creditBalanceUsd') state.credits.creditBalanceUsd += amount;
                if (key === 'sandboxBalanceUsd') state.credits.sandboxBalanceUsd += amount;
                if (key === 'totalDepositedUsd') state.credits.totalDepositedUsd += amount;
              }
            }
            return [{ balance: state.credits.creditBalanceUsd, total: state.credits.totalDepositedUsd }];
          },
        }),
      }),
    }),
    insert: () => ({
      values: async (values: any) => {
        state.events.push({
          id: values.id,
          capability: values.capability,
          transactionHash: values.metadataJson?.transactionHash ?? null,
        });
      },
    }),
  };

  return {
    db: { transaction: async (fn: any) => fn(tx) },
    sql,
    eq,
    and,
    desc: (c: any) => c,
    __schema: { credits, events },
  };
});

vi.mock('@saasfly/db-core/schema', () => {
  return {
    hermesTenantCredits: {
      __table: 'hermes_tenant_credits',
      tenantId: col('tenantId'),
      creditBalanceUsd: col('creditBalanceUsd'),
      sandboxBalanceUsd: col('sandboxBalanceUsd'),
      totalDepositedUsd: col('totalDepositedUsd'),
    },
    hermesComputeUsageEvents: {
      __table: 'hermes_compute_usage_events',
      id: col('id'),
      capability: col('capability'),
      metadataJson: col('metadataJson'),
    },
  };
});

vi.mock('../tenant-credit-ledger.service', () => ({
  TenantCreditLedgerService: {
    MIN_TOPUP_AMOUNT_USD: 10,
    getOrCreateCredits: async () => ({
      markupPercentage: 35,
      creditBalanceUsd: 0,
      sandboxBalanceUsd: 0,
      totalDepositedUsd: 0,
    }),
    updateInMemoryCredits: vi.fn(),
  },
}));

import { TenantBillingService } from '../tenant-billing.service';

describe('processDeposit — atomicidad e idempotencia', () => {
  beforeEach(() => {
    process.env.PANDORAS_TREASURY_WALLET = '0xc52BB6f53C91ff7134e7508B102E5A22BA415954';
    state.credits = { creditBalanceUsd: 0, sandboxBalanceUsd: 0, totalDepositedUsd: 0 };
    state.events = [];
    state.failUpdate = false;
    state.rowExists = true;
  });

  it('LED-01: rechaza por debajo del mínimo', async () => {
    await expect(
      TenantBillingService.processDeposit({ tenantId: 'forge', amountUsd: 9.99, isSandbox: false })
    ).rejects.toThrow('mínimo de recarga');
  });

  it('LED-02: dos depósitos distintos se suman (no hay lost update)', async () => {
    await TenantBillingService.processDeposit({ tenantId: 'forge', amountUsd: 10, isSandbox: false, transactionHash: '0x' + 'a'.repeat(64) });
    const second = await TenantBillingService.processDeposit({ tenantId: 'forge', amountUsd: 25, isSandbox: false, transactionHash: '0x' + 'b'.repeat(64) });

    expect(state.credits.creditBalanceUsd).toBe(35);
    expect(second.newBalanceUsd).toBe(35);
  });

  it('LED-03: el mismo txHash no se acredita dos veces (idempotente)', async () => {
    const txHash = '0x' + 'c'.repeat(64);
    await TenantBillingService.processDeposit({ tenantId: 'forge', amountUsd: 10, isSandbox: false, transactionHash: txHash });
    const replay = await TenantBillingService.processDeposit({ tenantId: 'forge', amountUsd: 10, isSandbox: false, transactionHash: txHash });

    expect(state.credits.creditBalanceUsd).toBe(10);
    expect(replay.newBalanceUsd).toBe(10);
    expect(state.events).toHaveLength(1);
  });

  it('LED-04: un fallo de escritura se propaga (no hay éxito falso)', async () => {
    state.failUpdate = true;

    await expect(
      TenantBillingService.processDeposit({ tenantId: 'forge', amountUsd: 10, isSandbox: false, transactionHash: '0x' + 'd'.repeat(64) })
    ).rejects.toThrow('DB_WRITE_FAILED');

    expect(state.credits.creditBalanceUsd).toBe(0);
  });

  it('LED-05: si el tenant no tiene fila de saldo, no se acredita', async () => {
    state.rowExists = false;

    await expect(
      TenantBillingService.processDeposit({ tenantId: 'fantasma', amountUsd: 10, isSandbox: false, transactionHash: '0x' + 'e'.repeat(64) })
    ).rejects.toThrow('no existe');
  });
});
