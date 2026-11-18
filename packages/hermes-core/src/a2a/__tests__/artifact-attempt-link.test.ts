import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * El callback de Sofía debe cerrar el intento de generación.
 *
 * Falla si se quita el cierre (el job quedaría UNKNOWN y la reserva congelada),
 * si se abre el scope a otro tenant/request, o si se re-abre un intento ya
 * terminado o fallido.
 */

let captured: { values: any; predicate: any } | null = null;
let updatedRows: any[] = [];

vi.mock('@saasfly/db-core', () => ({
  eq: (column: any, value: any) => ({ kind: 'eq', column: column.__col, value }),
  ne: (column: any, value: any) => ({ kind: 'ne', column: column.__col, value }),
  and: (...parts: any[]) => ({ kind: 'and', parts }),
}));

vi.mock('@saasfly/db-core/schema', () => ({
  hermesGenerationAttempts: {
    __table: 'hermes_generation_attempts',
    id: { __col: 'id' },
    tenantId: { __col: 'tenant_id' },
    requestId: { __col: 'request_id' },
    status: { __col: 'status' },
    artifactId: { __col: 'artifact_id' },
  },
}));

import { closeGenerationAttemptForArtifact } from '../artifact-attempt-link';

function fakeDb() {
  return {
    update: () => ({
      set: (values: any) => ({
        where: (predicate: any) => ({
          returning: async () => {
            captured = { values, predicate };
            return updatedRows;
          },
        }),
      }),
    }),
  };
}

describe('closeGenerationAttemptForArtifact', () => {
  beforeEach(() => {
    captured = null;
    updatedRows = [{ id: 'att_sofia_req_1_1' }];
  });

  it('ATT-01: marca el intento COMPLETED con el artifactId y acotado a tenant+request', async () => {
    const count = await closeGenerationAttemptForArtifact({
      tenantId: 'forge',
      requestId: 'req_1',
      artifactId: 'art_sofia_1',
      dbClient: fakeDb(),
    });

    expect(count).toBe(1);
    expect(captured?.values.status).toBe('COMPLETED');
    expect(captured?.values.artifactId).toBe('art_sofia_1');
    expect(captured?.values.updatedAt).toBeInstanceOf(Date);

    const parts = captured?.predicate.parts ?? [];
    expect(parts).toContainEqual({ kind: 'eq', column: 'tenant_id', value: 'forge' });
    expect(parts).toContainEqual({ kind: 'eq', column: 'request_id', value: 'req_1' });
    // Idempotencia: no se re-abre un intento ya COMPLETED ni se resucita un FAILED.
    expect(parts).toContainEqual({ kind: 'ne', column: 'status', value: 'COMPLETED' });
    expect(parts).toContainEqual({ kind: 'ne', column: 'status', value: 'FAILED' });
  });

  it('ATT-02: sin db no explota y no actualiza nada', async () => {
    const count = await closeGenerationAttemptForArtifact({
      tenantId: 'forge',
      requestId: 'req_1',
      artifactId: 'art_sofia_1',
      dbClient: null,
    });

    expect(count).toBe(0);
    expect(captured).toBeNull();
  });

  it('ATT-03: si falta tenant, request o artifact no toca la DB', async () => {
    const count = await closeGenerationAttemptForArtifact({
      tenantId: '',
      requestId: 'req_1',
      artifactId: 'art_sofia_1',
      dbClient: fakeDb(),
    });

    expect(count).toBe(0);
    expect(captured).toBeNull();
  });
});
