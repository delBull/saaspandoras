/**
 * 🏛️ A2A — Lectura gobernada para Sofía (asistente personal del Fundador)
 *
 * Verifica el cableado real del handler, no una réplica de la lógica:
 *  · capabilities `hermes.contacts.read` / `hermes.deals.read` en el registro,
 *  · hechos gobernados filtrados por el techo de clasificación del agente,
 *  · contactos sin tokens ni permisos,
 *  · deals sólo en el scope de Pandora's.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => {
  const TABLES: Record<string, { __t: string }> = {
    hermesKnowledge: { __t: 'knowledge' },
    nexusPodContacts: { __t: 'podContacts' },
    nexusCollaborators: { __t: 'collaborators' },
    nexusDealRooms: { __t: 'rooms' },
    nexusDealPods: { __t: 'pods' },
    hermesAgents: { __t: 'agents' },
  };

  const rows: Record<string, any[]> = {
    knowledge: [
      { key: 'pandoras_contexto_operativo', dimension: 'overview', classification: 'INTERNAL_OPERATIONAL', content: 'contexto', version: 1, updatedAt: new Date() },
      { key: 'pricing_transparency', dimension: 'policy', classification: 'PUBLIC', content: 'pricing', version: 1, updatedAt: new Date() },
      { key: 'blindaje_corporativo', dimension: 'legal_holding', classification: 'SECRET', content: 'legal', version: 1, updatedAt: new Date() },
    ],
    podContacts: [
      { name: 'Luis Guardado', role: 'CLIENT', relationship: 'Editorial', phone: '+5213222149409', email: 'luis@example.com', context: { company: 'Keeper' }, podCode: 'EDITORIAL', podName: 'Editorial', updatedAt: new Date() },
    ],
    collaborators: [
      { name: 'Oscar Trueba', role: 'MARKETING', email: 'oscar@pandoras.finance', whatsappPhone: '+523332353625', status: 'ACTIVE' },
    ],
    rooms: [
      { publicId: 'PDR-EDITORIAL', kind: 'CONTRACT', status: 'SIGNED', title: 'Contrato Editorial', counterparty: 'Luis Guardado', company: 'Keeper', summary: 'CMS', ndaEnabled: true, pofEnabled: false, createdAt: new Date(), updatedAt: new Date() },
    ],
    pods: [
      { code: 'EDITORIAL', displayName: 'Editorial', status: 'ACTIVE', confidentiality: 'HIGH', currency: 'USD' },
    ],
    agents: [],
  };

  return { TABLES, rows };
});

vi.mock('@saasfly/db-core', () => {
  const chain = (tableKey: string) => {
    const builder: any = {};
    builder.from = () => builder;
    builder.leftJoin = () => builder;
    builder.where = () => builder;
    builder.orderBy = () => builder;
    builder.limit = () => Promise.resolve(h.rows[tableKey] ?? []);
    return builder;
  };

  return {
    db: { select: () => ({ from: (t: any) => chain(t.__t) }) },
    hermesKnowledge: h.TABLES.hermesKnowledge,
    nexusPodContacts: h.TABLES.nexusPodContacts,
    nexusCollaborators: h.TABLES.nexusCollaborators,
    nexusDealRooms: h.TABLES.nexusDealRooms,
    nexusDealPods: h.TABLES.nexusDealPods,
    hermesAgents: h.TABLES.hermesAgents,
    and: (...args: any[]) => ({ and: args }),
    eq: (a: any, b: any) => ({ eq: [a, b] }),
    isNotNull: (a: any) => ({ isNotNull: a }),
    desc: (a: any) => a,
    sql: () => ({}),
  };
});

vi.mock('../a2a-security-validator', () => ({
  A2ASecurityValidator: { validateAsync: async () => ({ valid: true }) },
}));

vi.mock('../../tenants/tenant-authority', () => ({
  TenantAuthorityService: {
    resolveCanonicalTenant: async (tenantId: string) => ({ canonicalOrgId: tenantId, projectSlug: tenantId }),
  },
}));

vi.mock('../../knowledge/claim-contract-engine', () => ({
  ClaimContractEngine: { getOrLoadContract: async () => undefined },
}));

vi.mock('../../runtime/security-audit-logger', () => ({
  SecurityAuditLogger: { logEvent: async () => undefined },
}));

import { A2AMessageHandler } from '../a2a-message-handler';
import { AgentRegistry } from '../agent-registry';
import type { A2AMessage } from '../contracts';

function envelope(type: any, payload: Record<string, unknown> = {}): A2AMessage<any> {
  return {
    protocol: 'pandoras-a2a',
    version: '1.1',
    messageId: `msg_${Math.random().toString(36).slice(2)}`,
    correlationId: `corr_${Math.random().toString(36).slice(2)}`,
    from: 'sofia',
    to: 'hermes',
    tenantId: 'pandoras',
    type,
    createdAt: new Date().toISOString(),
    nonce: `nonce_${Math.random().toString(36).slice(2)}`,
    payload,
    security: { signature: 'mock_sig', signatureScheme: 'EIP191', hmac: 'x' },
  } as A2AMessage<any>;
}

const originalClearance = () => AgentRegistry.getAgent('sofia')?.maxClearance;

describe('A2A · lectura gobernada para Sofía', () => {
  afterEach(() => {
    const sofia = AgentRegistry.getAgent('sofia');
    if (sofia) sofia.maxClearance = originalClearance() || 'SECRET';
  });

  it('SRA-01: Sofía tiene lectura de contactos y deals; Hermes no puede auto-concedérselos', () => {
    const sofia = AgentRegistry.getAgent('sofia');
    expect(sofia?.allowedCapabilities).toContain('hermes.contacts.read');
    expect(sofia?.allowedCapabilities).toContain('hermes.deals.read');
    expect(sofia?.maxClearance).toBe('SECRET');

    const hermes = AgentRegistry.getAgent('hermes');
    expect(hermes?.allowedCapabilities).not.toContain('hermes.contacts.read');
    expect(hermes?.allowedCapabilities).not.toContain('hermes.deals.read');
  });

  it('SRA-02: knowledge.query entrega hechos gobernados y mantiene los claims', async () => {
    const res = await A2AMessageHandler.processIncomingMessage(envelope('knowledge.query', { tenantId: 'pandoras' }));
    const payload = res.payload as any;

    expect(res.success).toBe(true);
    expect(Array.isArray(payload.claims)).toBe(true);
    expect(payload.governedFactsCount).toBe(3);
    expect(payload.knowledgeCeiling).toBe('SECRET');
    expect(payload.governedFacts.map((f: any) => f.key)).toContain('blindaje_corporativo');
    expect(payload.excludedByClearance).toBe(0);
  });

  it('SRA-03: el techo de clasificación se aplica (bajarlo a PUBLIC excluye SECRET)', async () => {
    const sofia = AgentRegistry.getAgent('sofia')!;
    sofia.maxClearance = 'PUBLIC' as any;

    const res = await A2AMessageHandler.processIncomingMessage(envelope('knowledge.query', { tenantId: 'pandoras' }));
    const payload = res.payload as any;

    const keys = payload.governedFacts.map((f: any) => f.key);
    expect(keys).toContain('pricing_transparency');
    expect(keys).not.toContain('blindaje_corporativo');
    expect(payload.excludedByClearance).toBe(2);
  });

  it('SRA-04: contacts.query devuelve la ficha del pod y colaboradores sin tokens ni permisos', async () => {
    const res = await A2AMessageHandler.processIncomingMessage(envelope('contacts.query', { tenantId: 'pandoras' }));
    const payload = res.payload as any;

    expect(res.success).toBe(true);
    expect(payload.status).toBe('CONTACTS_SHARED');
    expect(payload.podContacts).toHaveLength(1);
    expect(payload.podContacts[0].name).toBe('Luis Guardado');
    expect(payload.podContacts[0].podCode).toBe('EDITORIAL');

    expect(payload.collaborators).toHaveLength(1);
    expect(payload.collaborators[0]).not.toHaveProperty('token');
    expect(payload.collaborators[0]).not.toHaveProperty('permissions');
  });

  it('SRA-05: deals.query devuelve las salas en scope Pandora\'s y vacío fuera de él', async () => {
    const inScope = await A2AMessageHandler.processIncomingMessage(envelope('deals.query', { tenantId: 'pandoras' }));
    const p1 = inScope.payload as any;
    expect(p1.status).toBe('DEALS_SHARED');
    expect(p1.rooms).toHaveLength(1);
    expect(p1.rooms[0].publicId).toBe('PDR-EDITORIAL');
    expect(p1.pods).toHaveLength(1);

    const outOfScope = await A2AMessageHandler.processIncomingMessage(envelope('deals.query', { tenantId: 'snarai' }));
    const p2 = outOfScope.payload as any;
    expect(p2.status).toBe('NO_DEALS_IN_SCOPE');
    expect(p2.rooms).toHaveLength(0);
    expect(p2.reason).toBe('DEALS_SCOPE_PANDORAS_ONLY');
  });
});
