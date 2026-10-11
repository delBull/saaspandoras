import { describe, it, expect } from 'vitest';
import { ActorIdentityBindingService } from '../prompt-hygiene-contract';

describe('🛡️ ActorIdentityBindingService Strict Cryptographic & Fail-Closed Validation', () => {
  it('creates and validates a valid ActorBindingProof and BoundActorSession', () => {
    const session = ActorIdentityBindingService.createBoundSession(
      {
        actorId: 'test_actor_1',
        tenantId: 'pandoras',
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: 'valid_sig_123',
        issuedAt: Date.now(),
        nonce: 'nonce_abc_123',
      },
      'CONFIDENTIAL',
      3600
    );

    expect(session).toBeDefined();
    expect(session.actorId).toBe('test_actor_1');
    expect(session.clearanceLevel).toBe('CONFIDENTIAL');
    expect(session.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));

    const isValid = ActorIdentityBindingService.validateSession(session);
    expect(isValid).toBe(true);
  });

  it('rejects an ActorBindingProof with missing proofSignature or nonce', () => {
    expect(() => {
      ActorIdentityBindingService.createBoundSession(
        {
          actorId: 'test_actor_2',
          tenantId: 'pandoras',
          authProvider: 'PORTAL_INTERNAL',
          proofSignature: '',
          issuedAt: Date.now(),
          nonce: 'nonce_abc_123',
        },
        'PUBLIC',
        1800
      );
    }).toThrow('Non-empty proofSignature is required');

    expect(() => {
      ActorIdentityBindingService.createBoundSession(
        {
          actorId: 'test_actor_2',
          tenantId: 'pandoras',
          authProvider: 'PORTAL_INTERNAL',
          proofSignature: 'sig_123',
          issuedAt: Date.now(),
          nonce: '',
        },
        'PUBLIC',
        1800
      );
    }).toThrow('Non-empty nonce is required');
  });

  it('rejects creating session with expired ActorBindingProof', () => {
    const staleProof = {
      actorId: 'test_actor_3',
      tenantId: 'pandoras',
      authProvider: 'PORTAL_INTERNAL' as const,
      proofSignature: 'sig_123',
      issuedAt: Date.now() - 7200 * 1000, // 2 hours ago
      nonce: 'nonce_123',
    };

    expect(() => {
      ActorIdentityBindingService.createBoundSession(staleProof, 'PUBLIC', 1800);
    }).toThrow('ActorBindingProof expired or excessive clock skew');
  });

  it('detects tampered session HMAC signature', () => {
    const session = ActorIdentityBindingService.createBoundSession(
      {
        actorId: 'test_actor_tamper',
        tenantId: 'pandoras',
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: 'sig_valid',
        issuedAt: Date.now(),
        nonce: 'nonce_tamper',
      },
      'CONFIDENTIAL',
      3600
    );

    const tamperedSession = {
      ...session,
      hmacSignature: session.hmacSignature.replace(/^[0-9a-f]/, 'z'),
    };

    expect(ActorIdentityBindingService.validateSession(tamperedSession)).toBe(false);
  });

  it('creates an internal system session with valid binding proof and session token', () => {
    const session = ActorIdentityBindingService.createInternalSystemSession({
      actorId: 'system_bot_internal',
      tenantId: 'pandoras',
      clearanceLevel: 'INTERNAL_OPERATIONAL',
    });

    expect(session.actorId).toBe('system_bot_internal');
    expect(session.clearanceLevel).toBe('INTERNAL_OPERATIONAL');
    expect(ActorIdentityBindingService.validateSession(session)).toBe(true);
  });
});

describe('🛡️ assertSessionMatchesRequest — Session-to-Request Binding (H1.1)', () => {
  const buildSession = (actorId: string, tenantId: string) =>
    ActorIdentityBindingService.createBoundSession(
      {
        actorId,
        tenantId,
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: 'sig_valid',
        issuedAt: Date.now(),
        nonce: `nonce_${actorId}`,
      },
      'CONFIDENTIAL',
      3600
    );

  it('accepts a session whose actorId and tenantId match the request', () => {
    const session = buildSession('actor_a', 'snarai');
    expect(() =>
      ActorIdentityBindingService.assertSessionMatchesRequest(session, {
        actorId: 'actor_a',
        organizationId: 'snarai',
      })
    ).not.toThrow();
  });

  it('accepts a session bound to the canonical tenant UUID while the request carries the slug', () => {
    const session = buildSession('actor_b', '11111111-1111-1111-1111-111111111111');
    expect(() =>
      ActorIdentityBindingService.assertSessionMatchesRequest(session, {
        actorId: 'actor_b',
        organizationId: 'snarai',
        canonicalTenantId: '11111111-1111-1111-1111-111111111111',
        projectSlug: 'snarai',
      })
    ).not.toThrow();
  });

  it('accepts any bound tenant for the shared pandoras root', () => {
    const session = buildSession('actor_c', '99999999-9999-9999-9999-999999999999');
    expect(() =>
      ActorIdentityBindingService.assertSessionMatchesRequest(session, {
        actorId: 'actor_c',
        organizationId: 'pandoras',
        canonicalTenantId: 'pandoras',
        projectSlug: 'pandoras',
      })
    ).not.toThrow();
  });

  it('rejects a session minted for a different actorId', () => {
    const session = buildSession('actor_owner', 'snarai');
    expect(() =>
      ActorIdentityBindingService.assertSessionMatchesRequest(session, {
        actorId: 'actor_attacker',
        organizationId: 'snarai',
      })
    ).toThrow('does not match the request actor');
  });

  it('rejects a session minted for an unrelated tenant', () => {
    const session = buildSession('actor_d', 'foreign_tenant');
    expect(() =>
      ActorIdentityBindingService.assertSessionMatchesRequest(session, {
        actorId: 'actor_d',
        organizationId: 'snarai',
        canonicalTenantId: '11111111-1111-1111-1111-111111111111',
        projectSlug: 'snarai',
      })
    ).toThrow('does not match the request tenant');
  });
});
