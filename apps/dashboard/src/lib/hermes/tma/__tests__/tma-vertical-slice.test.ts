import { describe, it, expect, beforeEach } from 'vitest';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { HermesSession } from '@/lib/hermes/auth/hermes-session.types';

describe('📱 Hermes OS Milestone 2.3 — TMA Vertical Slice BFF & Presentation Contracts', () => {
  const TEST_SECRET = 'test_secret_for_tma_vertical_slice_32_bytes_len';
  let tokenService: SessionTokenService;

  beforeEach(() => {
    process.env.HERMES_SESSION_SECRET = TEST_SECRET;
    tokenService = new SessionTokenService(TEST_SECRET);
  });

  const validSession: HermesSession = {
    subject: {
      telegramUserId: '123456789',
      username: 'operator_marco',
    },
    tenant: {
      organizationId: '9079ecf5-8d96-4074-a74e-5e92ef43c3cc',
      organizationName: "S'Narai Sanctuary",
      tenantSlug: 'snarai',
      projectId: 1,
    },
    actorId: 'usr_tma_operator_123',
    role: 'OWNER',
    sessionId: 'sess_tma_abc_123',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3600 * 1000,
    source: 'TELEGRAM',
  };

  it('TMA-001: Issues and validates signed session token for TMA BFF handshake', () => {
    const token = tokenService.issueToken(validSession);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const payload = tokenService.verifyToken(token);
    expect(payload.organizationId).toBe('9079ecf5-8d96-4074-a74e-5e92ef43c3cc');
    expect(payload.role).toBe('OWNER');
    expect(payload.sub).toBe('usr_tma_operator_123');
    expect(payload.source).toBe('TELEGRAM');
  });

  it('TMA-002: Rejects tampered TMA token payload fail-closed (401 Unauthorized)', () => {
    const token = tokenService.issueToken(validSession);
    const parts = token.split('.');
    
    // Tamper with payload to change organizationId
    const tamperedPayload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString());
    tamperedPayload.organizationId = '00000000-0000-0000-0000-000000000000';
    const tamperedToken = `${parts[0]}.${Buffer.from(JSON.stringify(tamperedPayload)).toString('base64url')}.${parts[2]}`;

    expect(() => tokenService.verifyToken(tamperedToken)).toThrow();
  });

  it('TMA-003: Rejects expired TMA token strictly', () => {
    const expiredSession: HermesSession = {
      ...validSession,
      issuedAt: Date.now() - 7200 * 1000,
      expiresAt: Date.now() - 3600 * 1000,
    };

    const expiredToken = tokenService.issueToken(expiredSession);
    expect(() => tokenService.verifyToken(expiredToken)).toThrow();
  });

  it('TMA-004: Workspace switching generates new authorized session with updated organizationId', () => {
    const initialToken = tokenService.issueToken(validSession);
    const initialPayload = tokenService.verifyToken(initialToken);
    expect(initialPayload.organizationId).toBe('9079ecf5-8d96-4074-a74e-5e92ef43c3cc');

    const targetOrgId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
    const switchedSession: HermesSession = {
      ...validSession,
      tenant: {
        organizationId: targetOrgId,
        organizationName: 'Aztecas Capital',
        tenantSlug: 'aztecas',
      },
      role: 'OPERATOR',
      sessionId: 'sess_tma_switched_456',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600 * 1000,
    };

    const switchedToken = tokenService.issueToken(switchedSession);
    const verifiedSwitched = tokenService.verifyToken(switchedToken);
    
    expect(verifiedSwitched.organizationId).toBe(targetOrgId);
    expect(verifiedSwitched.role).toBe('OPERATOR');
    expect(verifiedSwitched.telegramUserId).toBe(initialPayload.telegramUserId);
  });
});
