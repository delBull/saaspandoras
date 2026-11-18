import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * /api/v1/hermes/health debe reportar la verdad (sin inventar estados).
 */

const state = vi.hoisted(() => ({ dbDown: false, byoTenants: 1, pendingDeposits: 0 }));

vi.mock('@saasfly/db', () => ({
  sql: () => ({}),
  db: {
    execute: async () => {
      if (state.dbDown) throw new Error('connection refused');
      return [];
    },
    select: () => ({
      from: () => ({
        where: async () => [{ total: String(state.byoTenants) }],
      }),
    }),
  },
}));

vi.mock('@saasfly/db/schema', () => ({
  projects: { tenantRuntimeConfig: { __col: 'config' } },
  hermesCreditDeposits: { status: { __col: 'status' } },
}));

vi.mock('@saasfly/db-core', () => ({
  eq: () => ({}),
  sql: () => ({}),
}));

async function loadRoute() {
  vi.resetModules();
  return await import('../route');
}

describe('GET /api/v1/hermes/health', () => {
  beforeEach(() => {
    state.dbDown = false;
    state.byoTenants = 1;
    state.pendingDeposits = 0;

    process.env.SOFIA_BRIDGE_WEBHOOK_URL = 'https://sofia.example/api/v1/sofia/a2a/webhook';
    process.env.PANDORAS_TREASURY_WALLET = '0xc52BB6f53C91ff7134e7508B102E5A22BA415954';
    process.env.DISCORD_WEBHOOK_PANDORAS_ALERTS = 'https://discord.example/webhook';
    process.env.RUNPOD_API_KEY = 'rpa_test';
    delete process.env.IPFS_PIN_API_URL;

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 401 }))
    );
  });

  it('HLT-01: todo configurado y Sofía responde (401) → ok:true', async () => {
    const { GET } = await loadRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.components.database.status).toBe('UP');
    expect(body.components.sofia.status).toBe('UP');
    expect(body.components.sofia.httpStatus).toBe(401);
    expect(body.components.treasury.status).toBe('CONFIGURED');
    expect(body.components.discordAlerts.status).toBe('CONFIGURED');
    expect(body.components.computeRunpod.status).toBe('CONFIGURED');
    expect(body.components.pinning.managed).toBe('NOT_CONFIGURED');
    expect(body.components.pinning.byoTenants).toBe(1);
  });

  it('HLT-02: DB caída → 503 y ok:false (no finge salud)', async () => {
    state.dbDown = true;
    const { GET } = await loadRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.components.database.status).toBe('DOWN');
  });

  it('HLT-03: Sofía inalcanzable → DOWN pero el resto sigue reportándose', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('timeout');
      })
    );
    const { GET } = await loadRoute();
    const body = await (await GET()).json();

    expect(body.components.sofia.status).toBe('DOWN');
    expect(body.components.sofia.detail).toBe('unreachable_or_timeout');
    expect(body.ok).toBe(true); // la DB manda para el ok global
  });

  it('HLT-04: sin variables → NOT_CONFIGURED explícito (no inventa)', async () => {
    delete process.env.SOFIA_BRIDGE_WEBHOOK_URL;
    delete process.env.DISCORD_WEBHOOK_PANDORAS_ALERTS;
    delete process.env.PANDORAS_TREASURY_WALLET;
    delete process.env.NEXT_PUBLIC_PANDORAS_TREASURY_WALLET;
    delete process.env.PANDORAS_ADMIN_WALLET;
    delete process.env.NEXT_PUBLIC_PANDORAS_ADMIN_WALLET;
    delete process.env.RUNPOD_API_KEY;

    const { GET } = await loadRoute();
    const body = await (await GET()).json();

    expect(body.components.sofia.status).toBe('NOT_CONFIGURED');
    expect(body.components.discordAlerts.status).toBe('NOT_CONFIGURED');
    expect(body.components.treasury.status).toBe('NOT_CONFIGURED');
    expect(body.components.computeRunpod.status).toBe('NOT_CONFIGURED');
  });

  it('HLT-05: nunca expone secretos ni hostnames', async () => {
    const { GET } = await loadRoute();
    const serialized = JSON.stringify(await (await GET()).json());

    expect(serialized).not.toContain('rpa_test');
    expect(serialized).not.toContain('discord.example');
    expect(serialized).not.toContain('sofia.example');
    expect(serialized).not.toContain('0xc52BB6f5');
  });
});
