import { describe, it, expect, beforeEach } from 'vitest';
import { 
  TelegramAuthValidator,
  HermesTenantMembershipService,
  HermesWorkspaceResolver,
  SessionTokenService,
  HermesInvalidInitDataError,
  HermesExpiredInitDataError,
  HermesTenantAccessDeniedError
} from '../index';

describe('🔐 Hermes OS Milestone 2.1 — Telegram Identity & Tenant Membership Bridge', () => {
  const TEST_BOT_TOKEN = '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_TEST_TOKEN';
  const TEST_SESSION_SECRET = 'super-secret-hermes-session-key-for-testing-123456';

  let validator: TelegramAuthValidator;
  let tokenService: SessionTokenService;

  beforeEach(() => {
    validator = new TelegramAuthValidator({ botToken: TEST_BOT_TOKEN, maxAgeSeconds: 86400 });
    tokenService = new SessionTokenService(TEST_SESSION_SECRET);
  });

  describe('Suite A: TelegramAuthValidator (Cryptographic HMAC-SHA256 & Replay Protection)', () => {
    it('AUTH-001: Validates authentic signed initData from Telegram successfully', () => {
      const initData = TelegramAuthValidator.generateValidInitData({
        user: { id: 987654321, username: 'operator_marco', first_name: 'Marco' },
        botToken: TEST_BOT_TOKEN,
      });

      const identity = validator.validateInitData(initData);
      expect(identity.telegramUserId).toBe('987654321');
      expect(identity.username).toBe('operator_marco');
      expect(identity.firstName).toBe('Marco');
      expect(identity.authDate).toBeGreaterThan(0);
      expect(identity.hash).toBeDefined();
    });

    it('AUTH-002: Rejects tampered data string or mismatched hash', () => {
      const validInitData = TelegramAuthValidator.generateValidInitData({
        user: { id: 987654321, username: 'operator_marco' },
        botToken: TEST_BOT_TOKEN,
      });

      // Tamper with the user ID in the query string without updating hash
      const tamperedInitData = validInitData.replace('987654321', '111111111');

      expect(() => {
        validator.validateInitData(tamperedInitData);
      }).toThrow(HermesInvalidInitDataError);
    });

    it('AUTH-003: Rejects initData signed with a different bot token', () => {
      const wrongTokenInitData = TelegramAuthValidator.generateValidInitData({
        user: { id: 987654321, username: 'operator_marco' },
        botToken: 'DIFFERENT_BOT_TOKEN_999999',
      });

      expect(() => {
        validator.validateInitData(wrongTokenInitData);
      }).toThrow(HermesInvalidInitDataError);
    });

    it('AUTH-004: Rejects expired auth_date (> 24 hours)', () => {
      const expiredDate = Math.floor(Date.now() / 1000) - (86400 + 120); // 24h and 2 mins ago
      const expiredInitData = TelegramAuthValidator.generateValidInitData({
        user: { id: 987654321, username: 'operator_marco' },
        authDate: expiredDate,
        botToken: TEST_BOT_TOKEN,
      });

      expect(() => {
        validator.validateInitData(expiredInitData);
      }).toThrow(HermesExpiredInitDataError);
    });

    it('AUTH-005: Rejects missing required parameters fail-closed', () => {
      expect(() => validator.validateInitData('')).toThrow(HermesInvalidInitDataError);
      expect(() => validator.validateInitData('user=%7B%22id%22%3A123%7D')).toThrow(HermesInvalidInitDataError);
      expect(() => validator.validateInitData('hash=abcd1234')).toThrow(HermesInvalidInitDataError);
    });
  });

  describe('Suite B: HermesWorkspaceResolver (Canonical UUID Resolution)', () => {
    it('MEM-001: Resolves human slug (snarai) to canonical organizationId UUID', async () => {
      const resolved = await HermesWorkspaceResolver.resolveCanonicalWorkspace('snarai');
      expect(resolved.organizationId).toBeDefined();
      expect(resolved.organizationId.length).toBeGreaterThan(10); // Valid UUID
      expect(resolved.tenantSlug).toBe('snarai');
      expect(resolved.projectId).toBeDefined();
    });

    it('MEM-002: Rejects non-existent workspace with 404', async () => {
      expect(async () => {
        await HermesWorkspaceResolver.resolveCanonicalWorkspace('non_existent_workspace_xyz_999');
      }).toThrow();
    });
  });

  describe('Suite C: HermesTenantMembershipService (Authority Boundary & Access Control)', () => {
    const membershipService = new HermesTenantMembershipService();

    it('MEM-003: Non-existent telegram user returns empty authorized tenants list', async () => {
      const tenants = await membershipService.getAuthorizedTenants('unregistered_tg_999999999');
      expect(Array.isArray(tenants)).toBe(true);
      expect(tenants.length).toBe(0);
    });

    it('MEM-004: validateTenantAccess strictly rejects unauthorized tenant UUID (403 Forbidden)', async () => {
      const fakeOrgUuid = '99999999-9999-9999-9999-999999999999';
      
      expect(async () => {
        await membershipService.validateTenantAccess({
          telegramUserId: 'unauthorized_tg_user_123',
          targetOrganizationId: fakeOrgUuid,
        });
      }).toThrow(HermesTenantAccessDeniedError);
    });
  });

  describe('Suite D: SessionTokenService (Compact JWT Issuance & Verification)', () => {
    it('JWT-001: Issues compact signed token and verifies payload integrity', () => {
      const now = Date.now();
      const mockSession = {
        subject: {
          telegramUserId: '987654321',
          username: 'operator_marco',
          internalUserId: 'usr_abc_123',
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
        tenant: {
          organizationId: '9079ecf5-2162-4078-bddf-66b607e2d32f',
          organizationName: "S'Narai Sanctuary",
          tenantSlug: 'snarai',
          projectId: 1,
        },
        actorId: 'usr_abc_123',
        role: 'OWNER' as const,
        sessionId: 'hses_test_session_12345',
        issuedAt: now,
        expiresAt: now + 86400000,
        source: 'TELEGRAM' as const,
      };

      const token = tokenService.issueToken(mockSession);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const verified = tokenService.verifyToken(token);
      expect(verified.sub).toBe('usr_abc_123');
      expect(verified.telegramUserId).toBe('987654321');
      expect(verified.organizationId).toBe('9079ecf5-2162-4078-bddf-66b607e2d32f');
      expect(verified.role).toBe('OWNER');
      expect(verified.sessionId).toBe('hses_test_session_12345');
      expect(verified.source).toBe('TELEGRAM');
    });

    it('JWT-002: Rejects tampered token payload', () => {
      const now = Date.now();
      const mockSession = {
        subject: { telegramUserId: '987654321' },
        tenant: { organizationId: '9079ecf5-2162-4078-bddf-66b607e2d32f', organizationName: "S'Narai" },
        actorId: 'tg_987654321',
        role: 'OPERATOR' as const,
        sessionId: 'hses_123',
        issuedAt: now,
        expiresAt: now + 86400000,
        source: 'TELEGRAM' as const,
      };

      const token = tokenService.issueToken(mockSession);
      const [header, payload, sig] = token.split('.');
      expect(header).toBeDefined();
      expect(payload).toBeDefined();
      expect(sig).toBeDefined();
      
      // Tamper with payload
      const decodedPayload = JSON.parse(Buffer.from(payload!, 'base64').toString());
      decodedPayload.role = 'ADMIN'; // Attempt privilege escalation
      const tamperedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64').replace(/=/g, '');

      const tamperedToken = `${header}.${tamperedPayload}.${sig}`;

      expect(() => {
        tokenService.verifyToken(tamperedToken);
      }).toThrow();
    });

    it('JWT-003: Rejects expired token fail-closed', () => {
      const pastTime = Date.now() - (86400000 * 2); // 2 days ago
      const expiredSession = {
        subject: { telegramUserId: '987654321' },
        tenant: { organizationId: '9079ecf5-2162-4078-bddf-66b607e2d32f', organizationName: "S'Narai" },
        actorId: 'tg_987654321',
        role: 'OPERATOR' as const,
        sessionId: 'hses_expired',
        issuedAt: pastTime - 86400000,
        expiresAt: pastTime,
        source: 'TELEGRAM' as const,
      };

      const expiredToken = tokenService.issueToken(expiredSession);

      expect(() => {
        tokenService.verifyToken(expiredToken);
      }).toThrow();
    });

    it('JWT-004: Rejects token with unsupported/tampered algorithm header (e.g. none)', () => {
      const now = Date.now();
      const mockSession = {
        subject: { telegramUserId: '987654321' },
        tenant: { organizationId: '9079ecf5-2162-4078-bddf-66b607e2d32f', organizationName: "S'Narai" },
        actorId: 'tg_987654321',
        role: 'OPERATOR' as const,
        sessionId: 'hses_alg_test',
        issuedAt: now,
        expiresAt: now + 86400000,
        source: 'TELEGRAM' as const,
      };

      const token = tokenService.issueToken(mockSession);
      const [, payload, sig] = token.split('.');
      const tamperedHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64').replace(/=/g, '');
      const insecureToken = `${tamperedHeader}.${payload}.${sig}`;

      expect(() => {
        tokenService.verifyToken(insecureToken);
      }).toThrow();
    });

    it('JWT-005: Rejects token missing exp claim', () => {
      const now = Date.now();
      const mockSession = {
        subject: { telegramUserId: '987654321' },
        tenant: { organizationId: '9079ecf5-2162-4078-bddf-66b607e2d32f', organizationName: "S'Narai" },
        actorId: 'tg_987654321',
        role: 'OPERATOR' as const,
        sessionId: 'hses_no_exp',
        issuedAt: now,
        expiresAt: now + 86400000,
        source: 'TELEGRAM' as const,
      };

      const token = tokenService.issueToken(mockSession);
      const [header, payload, sig] = token.split('.');
      const decodedPayload = JSON.parse(Buffer.from(payload!, 'base64').toString());
      delete decodedPayload.exp;
      const noExpPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64').replace(/=/g, '');
      const noExpToken = `${header}.${noExpPayload}.${sig}`;

      expect(() => {
        tokenService.verifyToken(noExpToken);
      }).toThrow();
    });
  });
});
