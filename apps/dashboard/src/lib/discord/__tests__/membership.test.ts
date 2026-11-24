import { describe, it, expect } from 'vitest';
import {
  resolveMembership,
  rolesForMembership,
  allManagedRoles,
  SNARAI_TIER_THRESHOLDS,
} from '../membership';

const ROLES = {
  verified: 'r_verified',
  explorer: 'r_explorer',
  resident: 'r_resident',
  institutional: 'r_institutional',
  riviera: 'r_riviera',
};

describe('Discord · resolución de membresía S\'Narai', () => {
  it('sin compras, emisiones ni concesiones no es participante', () => {
    const r = resolveMembership({ paidOrders: [], mintedCertificates: 0 });
    expect(r.isParticipant).toBe(false);
    expect(r.tier).toBeNull();
    expect(r.certificates).toBe(0);
  });

  it('una orden pagada da acceso aunque no registre cuántos certificados incluye', () => {
    const r = resolveMembership({ paidOrders: [{ status: 'paid' }], mintedCertificates: 0 });
    expect(r.isParticipant).toBe(true);
    // Sin certificados no se inventa un nivel.
    expect(r.tier).toBeNull();
  });

  it('una orden pendiente no da acceso', () => {
    const r = resolveMembership({ paidOrders: [{ status: 'pending' }], mintedCertificates: 0 });
    expect(r.isParticipant).toBe(false);
  });

  it('el nivel se calcula por certificados emitidos', () => {
    expect(resolveMembership({ paidOrders: [], mintedCertificates: 12 }).tier).toBe('EXPLORER');
    expect(resolveMembership({ paidOrders: [], mintedCertificates: 50 }).tier).toBe('RESIDENT');
    expect(resolveMembership({ paidOrders: [], mintedCertificates: 500 }).tier).toBe('INSTITUTIONAL');
    expect(resolveMembership({ paidOrders: [], mintedCertificates: 2000 }).tier).toBe('RIVIERA');
  });

  it('respeta los límites exactos (49 no llega a Residente)', () => {
    expect(resolveMembership({ paidOrders: [], mintedCertificates: 49 }).tier).toBe('EXPLORER');
    expect(resolveMembership({ paidOrders: [], mintedCertificates: 1999 }).tier).toBe('INSTITUTIONAL');
  });

  it('suma órdenes con certificados, emisiones y concesión', () => {
    const r = resolveMembership({
      paidOrders: [{ status: 'paid', certificates: 10 }],
      mintedCertificates: 45,
      manualGrant: { certificates: 5 },
    });
    expect(r.certificates).toBe(60);
    expect(r.tier).toBe('RESIDENT');
  });

  it('una concesión de nivel manda aunque no haya certificados', () => {
    const r = resolveMembership({ paidOrders: [], mintedCertificates: 0, manualGrant: { tier: 'INSTITUTIONAL' } });
    expect(r.isParticipant).toBe(true);
    expect(r.tier).toBe('INSTITUTIONAL');
  });

  it('la concesión no baja un nivel ya ganado por certificados', () => {
    const r = resolveMembership({ paidOrders: [], mintedCertificates: 600, manualGrant: { tier: 'EXPLORER' } });
    expect(r.tier).toBe('INSTITUTIONAL');
  });

  it('los umbrales están ordenados de mayor a menor', () => {
    const mins = SNARAI_TIER_THRESHOLDS.map((t) => t.minCertificates);
    expect([...mins].sort((a, b) => b - a)).toEqual(mins);
  });

  it('asigna rol de verificado + rol de nivel sólo a participantes', () => {
    const none = resolveMembership({ paidOrders: [], mintedCertificates: 0 });
    expect(rolesForMembership(none, ROLES)).toEqual([]);

    const explorer = resolveMembership({ paidOrders: [], mintedCertificates: 10 });
    expect(rolesForMembership(explorer, ROLES)).toEqual(['r_verified', 'r_explorer']);

    const paidNoTier = resolveMembership({ paidOrders: [{ status: 'paid' }], mintedCertificates: 0 });
    expect(rolesForMembership(paidNoTier, ROLES)).toEqual(['r_verified']);
  });

  it('no devuelve roles vacíos configurados', () => {
    expect(allManagedRoles({ ...ROLES, explorer: '', resident: '' })).toEqual([
      'r_verified',
      'r_institutional',
      'r_riviera',
    ]);
  });
});
