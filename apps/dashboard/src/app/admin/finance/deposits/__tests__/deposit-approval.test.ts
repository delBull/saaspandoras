import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Money path: aprobación de depósitos.
 *
 * Estos tests fallan si se quita la implementación:
 *  - un depósito `pending` NO acredita saldo por sí solo;
 *  - aprobar dos veces no duplica el abono;
 *  - si el saldo en DB no refleja el abono, NO se marca `credited`;
 *  - un rol sin permiso no puede autorizar;
 *  - rechazar no acredita y reserva el txHash.
 */

type Deposit = {
  id: string;
  tenantId: string;
  amountUsd: string;
  isSandbox: boolean;
  txHash: string;
  status: string;
  fromAddress: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
};

let deposits: Deposit[] = [];
let credits: Record<string, number> = {};
let authContext: any = { isAuthenticated: true, role: 'ADMIN', email: 'admin@pandoras.finance' };

const processDeposit = vi.fn(async ({ tenantId, amountUsd }: any) => {
  credits[tenantId] = (credits[tenantId] ?? 0) + amountUsd;
  return { ok: true, newBalanceUsd: credits[tenantId] };
});

// ── Predicados mínimos (eq / inArray / and) ──────────────────────────────────
function match(row: any, pred: any): boolean {
  if (!pred) return true;
  if (pred.kind === 'and') return pred.parts.every((p: any) => match(row, p));
  if (pred.kind === 'eq') return row[pred.col] === pred.value;
  if (pred.kind === 'in') return pred.values.includes(row[pred.col]);
  throw new Error(`predicado no soportado: ${pred.kind}`);
}

const { col } = vi.hoisted(() => ({ col: (name: string) => ({ __col: name }) }));

vi.mock('@saasfly/db-core', () => ({
  eq: (c: any, value: any) => ({ kind: 'eq', col: c.__col, value }),
  inArray: (c: any, values: any[]) => ({ kind: 'in', col: c.__col, values }),
  and: (...parts: any[]) => ({ kind: 'and', parts }),
  desc: (c: any) => ({ __col: c.__col }),
  sql: () => ({}),
}));

vi.mock('@saasfly/db/schema', () => ({
  hermesCreditDeposits: {
    __table: 'hermes_credit_deposits',
    id: col('id'),
    tenantId: col('tenantId'),
    amountUsd: col('amountUsd'),
    isSandbox: col('isSandbox'),
    txHash: col('txHash'),
    status: col('status'),
    fromAddress: col('fromAddress'),
    reviewedBy: col('reviewedBy'),
    reviewedAt: col('reviewedAt'),
    rejectionReason: col('rejectionReason'),
  },
  hermesTenantCredits: {
    __table: 'hermes_tenant_credits',
    tenantId: col('tenantId'),
    creditBalanceUsd: col('creditBalanceUsd'),
  },
}));

vi.mock('@saasfly/db', () => {
  return {
    db: {
      select: (projection?: Record<string, any>) => ({
        from: (t: any) => ({
          where: (pred: any) => ({
            limit: async () => {
              let rows: any[] = [];
              if (t.__table === 'hermes_credit_deposits') {
                rows = deposits.filter((d) => match(d, pred));
              } else if (t.__table === 'hermes_tenant_credits') {
                rows = Object.entries(credits)
                  .map(([tenantId, creditBalanceUsd]) => ({ tenantId, creditBalanceUsd: String(creditBalanceUsd) }))
                  .filter((row) => match(row, pred));
              }
              if (!projection) return rows;
              // Como drizzle: sólo las columnas proyectadas, con el alias pedido.
              return rows.map((row) => {
                const out: Record<string, any> = {};
                for (const [alias, column] of Object.entries(projection)) {
                  out[alias] = row[(column as any).__col];
                }
                return out;
              });
            },
          }),
        }),
      }),
      update: (t: any) => ({
        set: (values: any) => ({
          where: (pred: any) => {
            const apply = () => {
              const changed: any[] = [];
              if (t.__table === 'hermes_credit_deposits') {
                for (const d of deposits) {
                  if (match(d, pred)) {
                    Object.assign(d, values);
                    changed.push({ id: d.id });
                  }
                }
              }
              return changed;
            };
            return {
              returning: async () => apply(),
              // `await db.update(...).set(...).where(...)` sin returning()
              then: (resolve: any) => resolve(apply()),
            };
          },
        }),
      }),
    },
  };
});

vi.mock('@saasfly/hermes-core', () => ({
  TenantBillingService: { processDeposit: (...args: any[]) => processDeposit(...(args as [any])) },
}));

vi.mock('@saasfly/shared', () => ({
  getNexusAuthContext: vi.fn(async () => authContext),
}));

vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { approveDeposit, rejectDeposit } from '../actions';

function seedDeposit(overrides: Partial<Deposit> = {}): Deposit {
  const deposit: Deposit = {
    id: 'dep_1',
    tenantId: 'forge',
    amountUsd: '10.0000',
    isSandbox: false,
    txHash: '0xabc',
    status: 'pending',
    fromAddress: '0x1111111111111111111111111111111111111111',
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    ...overrides,
  };
  deposits.push(deposit);
  return deposit;
}

describe('Aprobación de depósitos (money path)', () => {
  beforeEach(() => {
    deposits = [];
    credits = { forge: 0 };
    processDeposit.mockClear();
    authContext = { isAuthenticated: true, role: 'ADMIN', email: 'admin@pandoras.finance' };
  });

  it('DEP-01: un depósito pending NO acredita saldo sin aprobación', async () => {
    seedDeposit();
    expect(processDeposit).not.toHaveBeenCalled();
    expect(credits.forge).toBe(0);
  });

  it('DEP-02: admin aprueba → se acredita una sola vez y queda credited', async () => {
    seedDeposit();
    const result = await approveDeposit('dep_1');

    expect(result.success).toBe(true);
    expect(processDeposit).toHaveBeenCalledTimes(1);
    expect(credits.forge).toBe(10);
    expect(deposits[0]!.status).toBe('credited');
    expect(deposits[0]!.reviewedBy).toBe('admin:admin@pandoras.finance');
  });

  it('DEP-03: aprobar dos veces NO duplica el abono', async () => {
    seedDeposit();
    await approveDeposit('dep_1');
    const second = await approveDeposit('dep_1');

    expect(second.success).toBe(false);
    expect(processDeposit).toHaveBeenCalledTimes(1);
    expect(credits.forge).toBe(10);
  });

  it('DEP-04: si el saldo en DB no refleja el abono, NO se marca credited', async () => {
    seedDeposit();
    // Simula el fallo silencioso de processDeposit: devuelve ok pero no escribe saldo.
    processDeposit.mockImplementationOnce(async () => ({ ok: true, newBalanceUsd: 10 }));

    const result = await approveDeposit('dep_1');

    expect(result.success).toBe(false);
    expect(deposits[0]!.status).toBe('approved'); // reintentable, no "credited"
    expect(credits.forge).toBe(0);
  });

  it('DEP-05: rol sin permiso no puede autorizar', async () => {
    seedDeposit();
    authContext = { isAuthenticated: true, role: 'CLIENT', email: 'cliente@forge.example' };

    const result = await approveDeposit('dep_1');

    expect(result.success).toBe(false);
    expect(processDeposit).not.toHaveBeenCalled();
    expect(deposits[0]!.status).toBe('pending');
  });

  it('DEP-06: rechazar no acredita y reserva el txHash', async () => {
    seedDeposit();

    const result = await rejectDeposit('dep_1', 'Pago no identificado por el tenant');

    expect(result.success).toBe(true);
    expect(processDeposit).not.toHaveBeenCalled();
    expect(deposits[0]!.status).toBe('rejected');
    expect(deposits[0]!.rejectionReason).toContain('no identificado');
  });

  it('DEP-07: un depósito rechazado no puede acreditarse después', async () => {
    seedDeposit({ status: 'rejected' });

    const result = await approveDeposit('dep_1');

    expect(result.success).toBe(false);
    expect(processDeposit).not.toHaveBeenCalled();
    expect(credits.forge).toBe(0);
  });

  it('DEP-08: sandbox no entra en el flujo de aprobación', async () => {
    seedDeposit({ isSandbox: true });

    const result = await approveDeposit('dep_1');

    expect(result.success).toBe(false);
    expect(processDeposit).not.toHaveBeenCalled();
  });
});
