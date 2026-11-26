import { describe, it, expect } from 'vitest';
import {
  AGENT_KEY_PREFIX,
  createAgentKey,
  extractAgentKey,
  hashAgentKey,
  intersectCapabilities,
  isResourceInScope,
  isWithinValidity,
  normalizeDelegationDays,
  requiresHumanApproval,
  DELEGATION_MAX_DAYS,
  DELEGATION_DEFAULT_DAYS,
} from '../agent-identity';

describe('claves de agente', () => {
  it('genera una clave con prefijo reconocible y hash estable', () => {
    const { raw, prefix, hash } = createAgentKey();
    expect(raw.startsWith(AGENT_KEY_PREFIX)).toBe(true);
    expect(raw.length).toBeGreaterThan(30);
    expect(prefix.startsWith(AGENT_KEY_PREFIX)).toBe(true);
    expect(raw.startsWith(prefix)).toBe(true);
    expect(hashAgentKey(raw)).toBe(hash);
    expect(hash).toHaveLength(64);
  });

  it('dos claves nunca coinciden', () => {
    const a = createAgentKey();
    const b = createAgentKey();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });

  it('acepta Bearer y clave directa, y rechaza lo demás', () => {
    const headers = (value: string) => new Headers({ authorization: value });
    const { raw } = createAgentKey();

    expect(extractAgentKey(headers(`Bearer ${raw}`))).toBe(raw);
    expect(extractAgentKey(headers(raw))).toBe(raw);
    expect(extractAgentKey(headers('Bearer sk-otra-cosa'))).toBeNull();
    expect(extractAgentKey(new Headers())).toBeNull();
  });
});

describe('capabilities delegadas', () => {
  it('nunca amplía: sólo devuelve la intersección', () => {
    expect(intersectCapabilities(['developer', 'finance', 'dealRoom'], ['developer', 'dealRoom'])).toEqual([
      'dealRoom',
      'developer',
    ]);
    expect(intersectCapabilities(['payment.execute'], ['developer'])).toEqual([]);
  });

  it('ignora basura y normaliza a minúsculas', () => {
    expect(intersectCapabilities(['DEVELOPER', '', 42, null], ['developer'])).toEqual(['developer']);
    expect(intersectCapabilities('developer', ['developer'])).toEqual([]);
  });
});

describe('vigencia', () => {
  const now = new Date('2026-11-26T12:00:00Z');
  const inDays = (d: number) => new Date(now.getTime() + d * 86400000);

  it('activa y vigente pasa', () => {
    expect(isWithinValidity({ status: 'ACTIVE', expiresAt: inDays(1) }, now)).toBe(true);
  });

  it('vencida, revocada o sin fecha no pasa', () => {
    expect(isWithinValidity({ status: 'ACTIVE', expiresAt: inDays(-1) }, now)).toBe(false);
    expect(isWithinValidity({ status: 'REVOKED', expiresAt: inDays(1) }, now)).toBe(false);
    expect(isWithinValidity({ status: 'ACTIVE', expiresAt: null }, now)).toBe(false);
    expect(isWithinValidity({ status: 'ACTIVE', expiresAt: inDays(1), revokedAt: now }, now)).toBe(false);
  });

  it('una fecha ilegible falla cerrado', () => {
    expect(isWithinValidity({ status: 'ACTIVE', expiresAt: 'no-es-fecha' }, now)).toBe(false);
  });
});

describe('límites', () => {
  it('normaliza los días de la delegación', () => {
    expect(normalizeDelegationDays(undefined)).toBe(DELEGATION_DEFAULT_DAYS);
    expect(normalizeDelegationDays(7)).toBe(7);
    expect(normalizeDelegationDays(999)).toBe(DELEGATION_MAX_DAYS);
    expect(normalizeDelegationDays(-5)).toBe(DELEGATION_DEFAULT_DAYS);
  });

  it('las acciones sensibles siempre piden humano', () => {
    const patterns = ['deal.sign', 'payment.*', 'publish.*'];
    expect(requiresHumanApproval('deal.sign', patterns)).toBe(true);
    expect(requiresHumanApproval('payment.transfer', patterns)).toBe(true);
    expect(requiresHumanApproval('publish.instagram', patterns)).toBe(true);
    expect(requiresHumanApproval('deal.read', patterns)).toBe(false);
  });

  it('sin scope explícito no hay acceso al recurso', () => {
    expect(isResourceInScope({}, { type: 'pods', id: 'patria' })).toBe(false);
    expect(isResourceInScope({ pods: [] }, { type: 'pods', id: 'patria' })).toBe(false);
    expect(isResourceInScope({ pods: ['patria'] }, { type: 'pods', id: 'patria' })).toBe(true);
    expect(isResourceInScope({ pods: ['patria'] }, { type: 'pods', id: 'snarai' })).toBe(false);
  });
});
