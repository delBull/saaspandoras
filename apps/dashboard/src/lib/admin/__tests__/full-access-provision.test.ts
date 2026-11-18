import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Admin full-access: la instalación debe identificar productos por `product`,
 * no por `productFamily` (HERMES y GROWTH_OS comparten familia 'GROWTH_OS').
 */

const state = vi.hoisted(() => ({
  rows: [] as Array<{ id: number; projectId: number; product: string; productFamily: string; plan: string; status: string }>,
  inserts: [] as any[],
  updates: [] as any[],
}));

const { col } = vi.hoisted(() => ({ col: (name: string) => ({ __col: name }) }));

vi.mock('@saasfly/db-core', () => ({
  eq: (c: any, value: any) => ({ kind: 'eq', col: c.__col, value }),
  and: (...parts: any[]) => ({ kind: 'and', parts }),
  inArray: (c: any, values: any[]) => ({ kind: 'in', col: c.__col, values }),
}));

vi.mock('@saasfly/db/schema', () => ({
  projects: { __table: 'projects', id: col('id'), slug: col('slug'), organizationId: col('organizationId'), title: col('title') },
  installedProducts: {
    __table: 'installed',
    id: col('id'),
    projectId: col('projectId'),
    product: col('product'),
    productFamily: col('productFamily'),
    plan: col('plan'),
    status: col('status'),
  },
}));

vi.mock('@saasfly/nexus-deals-sdk', () => ({
  NftLabActivationService: { activate: async () => ({ alreadyActive: true }) },
}));

function match(row: any, pred: any): boolean {
  if (!pred) return true;
  if (pred.kind === 'and') return pred.parts.every((p: any) => match(row, p));
  if (pred.kind === 'eq') return row[pred.col] === pred.value;
  if (pred.kind === 'in') return pred.values.includes(row[pred.col]);
  return true;
}

vi.mock('@saasfly/db', () => ({
  db: {
    select: () => ({
      from: (t: any) => ({
        where: (pred: any) => ({
          limit: async () => {
            if (t.__table === 'projects') return [{ id: 186, organizationId: 'org-1', title: 'Forge' }];
            return state.rows.filter((r) => match(r, pred));
          },
        }),
      }),
    }),
    update: () => ({
      set: (values: any) => ({
        where: async (pred: any) => {
          for (const r of state.rows) if (match(r, pred)) Object.assign(r, values);
          state.updates.push(values);
        },
      }),
    }),
    insert: () => ({
      values: async (values: any) => {
        state.inserts.push(values);
        state.rows.push({ id: state.rows.length + 1, ...values });
      },
    }),
  },
}));

import { provisionFullAccess } from '../full-access-provision.service';

describe('provisionFullAccess (match por producto)', () => {
  beforeEach(() => {
    state.inserts = [];
    state.updates = [];
    state.rows = [];
  });

  it('FA-01: con HERMES instalado (familia GROWTH_OS) instala GROWTH_OS como producto distinto', async () => {
    state.rows.push({ id: 1, projectId: 186, product: 'HERMES', productFamily: 'GROWTH_OS', plan: 'enterprise', status: 'active' });

    const { results } = await provisionFullAccess('forge', 'admin@test');

    // Hermes no se duplica (ya estaba full).
    const hermesInserts = state.inserts.filter((i) => i.product === 'HERMES');
    expect(hermesInserts).toHaveLength(0);

    // Growth OS sí se instala porque es otro producto.
    const growth = state.inserts.find((i) => i.product === 'GROWTH_OS');
    expect(growth).toBeDefined();

    // RWA también.
    expect(state.inserts.some((i) => i.product === 'TOKENIZATION')).toBe(true);

    // El resultado conserva la etiqueta de familia para la UI del admin.
    expect(results.some((r) => r.family === 'HERMES' && r.action === 'already_full')).toBe(true);
    expect(results.some((r) => r.family === 'GROWTH_OS' && r.action === 'installed')).toBe(true);
  });

  it('FA-02: una fila legacy HERMES_OS cuenta como HERMES (no duplica)', async () => {
    state.rows.push({ id: 1, projectId: 186, product: 'HERMES_OS', productFamily: 'HERMES', plan: 'trial', status: 'trial' });

    await provisionFullAccess('forge', 'admin@test');

    expect(state.inserts.some((i) => i.product === 'HERMES')).toBe(false);
    // Se actualiza a enterprise la fila existente.
    expect(state.rows.find((r) => r.product === 'HERMES_OS')?.plan).toBe('enterprise');
  });

  it('FA-03: al insertar usa la familia canónica del registry', async () => {
    await provisionFullAccess('forge', 'admin@test');

    const hermes = state.inserts.find((i) => i.product === 'HERMES');
    const rwa = state.inserts.find((i) => i.product === 'TOKENIZATION');

    expect(hermes?.productFamily).toBe('GROWTH_OS');
    expect(rwa?.productFamily).toBe('INFRASTRUCTURE');
  });
});
