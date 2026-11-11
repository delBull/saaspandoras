import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * POST /api/v1/hermes/billing/deposit (dinero real)
 *
 * Contrato que estos tests protegen:
 *  - El importe sale de la cadena, no del body.
 *  - Un pago verificado queda `pending` y NO acredita saldo (202).
 *  - Si el on-chain manda menos del mínimo, se rechaza sin registrar.
 *  - Un txHash ya registrado no se procesa dos veces (409).
 */

const TREASURY = '0xc52BB6f53C91ff7134e7508B102E5A22BA415954';

const h = vi.hoisted(() => ({ transferValue: 10_000_000n, receipt: null as any }));
let inserted: any[] = [];
let existingRow: { id: string; status: string } | null = null;
const processDeposit = vi.fn(async () => ({ ok: true, newBalanceUsd: 10 }));
const notifyPendingDeposit = vi.fn(async () => ({ sent: true }));

vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createPublicClient: () => ({ getTransactionReceipt: async () => h.receipt }),
    decodeEventLog: () => ({
      eventName: 'Transfer',
      args: { from: '0x1111111111111111111111111111111111111111', to: TREASURY, value: h.transferValue },
    }),
    http: () => ({}),
  };
});

vi.mock('@/lib/payments/treasury', () => ({
  resolveTreasuryWallet: () => ({ ok: true, wallet: TREASURY }),
}));

vi.mock('@/lib/portal/resolve-portal-context', () => ({
  tryResolvePortalContext: async () => ({ organization: { slug: 'forge' }, role: 'OWNER' }),
}));

vi.mock('@/lib/alerts/deposit-review-notifier', () => ({
  notifyPendingDeposit: (...args: any[]) => notifyPendingDeposit(...(args as [])),
}));

vi.mock('@saasfly/hermes-core', () => ({
  TenantBillingService: { processDeposit: (...args: any[]) => processDeposit(...(args as [])) },
  TenantCreditLedgerService: { MIN_TOPUP_AMOUNT_USD: 10 },
}));

vi.mock('@saasfly/db/schema', () => ({
  hermesCreditDeposits: { id: { __col: 'id' }, txHash: { __col: 'txHash' }, status: { __col: 'status' } },
}));

vi.mock('@saasfly/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (existingRow ? [existingRow] : []),
        }),
      }),
    }),
    insert: () => ({
      values: async (values: any) => {
        inserted.push(values);
      },
    }),
  },
}));

import { POST as deposit } from '../route';

const TX = `0x${'a'.repeat(64)}`;

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/v1/hermes/billing/deposit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Depósito on-chain → revisión', () => {
  beforeEach(() => {
    inserted = [];
    existingRow = null;
    processDeposit.mockClear();
    notifyPendingDeposit.mockClear();
    h.transferValue = 10_000_000n;
    h.receipt = {
      status: 'success',
      blockNumber: 123n,
      logs: [
        {
          address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          data: '0x',
          topics: [],
        },
      ],
    };
  });

  it('DEP-R1: pago verificado → 202 PENDING_REVIEW y NO acredita saldo', async () => {
    const res = await deposit(request({ tenantId: 'forge', txHash: TX, chainId: 8453, amountUsd: 10 }));

    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.status).toBe('PENDING_REVIEW');
    expect(body.credited).toBe(false);
    expect(body.amountUsd).toBe(10);

    expect(processDeposit).not.toHaveBeenCalled();
    expect(inserted).toHaveLength(1);
    expect(inserted[0].status).toBe('pending');
    expect(notifyPendingDeposit).toHaveBeenCalledTimes(1);
  });

  it('DEP-R2: el importe acreditado es el de la cadena, no el declarado', async () => {
    const res = await deposit(request({ tenantId: 'forge', txHash: TX, chainId: 8453, amountUsd: 5 }));

    const body = await res.json();
    expect(res.status).toBe(202);
    expect(body.amountUsd).toBe(10); // declaró 5; la cadena movió 10
    expect(inserted[0].amountUsd).toBe('10.0000');
  });

  it('DEP-R3: pago por debajo del mínimo → 422 y no se registra', async () => {
    h.transferValue = 3_000_000n; // $3.00 (mínimo $10)

    const res = await deposit(request({ tenantId: 'forge', txHash: TX, chainId: 8453 }));
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.code).toBe('BELOW_MIN_TOPUP');
    expect(inserted).toHaveLength(0);
    expect(processDeposit).not.toHaveBeenCalled();
  });

  it('DEP-R4: txHash ya registrado → 409 sin volver a procesar', async () => {
    existingRow = { id: 'dep_prev', status: 'pending' };

    const res = await deposit(request({ tenantId: 'forge', txHash: TX, chainId: 8453 }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe('TX_ALREADY_REGISTERED');
    expect(inserted).toHaveLength(0);
    expect(processDeposit).not.toHaveBeenCalled();
  });
});
