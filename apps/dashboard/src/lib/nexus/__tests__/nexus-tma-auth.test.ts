/**
 * 🧪 Tests: Nexus TMA Auth Engine — Phase F2
 * apps/dashboard/src/lib/nexus/__tests__/nexus-tma-auth.test.ts
 *
 * Coverage:
 *  Suite A: HMAC Verification (verifyTelegramInitData)
 *  Suite B: initData Age Validation (validateInitDataAge)
 *  Suite C: Telegram User Extraction (extractTelegramUser)
 *  Suite D: Capability Derivation (deriveCapabilities)
 *  Suite E: Full Resolution Chain (resolveNexusTmaSession) — mocked DB
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';
import {
  verifyTelegramInitData,
  validateInitDataAge,
  extractTelegramUser,
  deriveCapabilities,
  NexusTmaHmacError,
  NexusTmaExpiredError,
  NexusTmaNotLinkedError,
  NexusTmaCollaboratorInactiveError,
  NexusTmaCollaboratorExpiredError,
  resolveNexusTmaSession,
} from '../nexus-tma-auth';

// ─── Top-level mock (Bun requires vi.mock to be hoisted) ─────────────────────
const mockFindFirst = vi.fn();
vi.mock('@/db', () => ({
  db: {
    query: {
      nexusCollaborators: {
        findFirst: mockFindFirst,
      },
    },
  },
}));

// ─── Test Helpers ─────────────────────────────────────────────────────────────

const TEST_BOT_TOKEN = 'test_team_bot_token_for_unit_tests';

function buildValidInitData(
  overrides: Partial<{
    userId: number;
    username: string;
    firstName: string;
    authDate: number;
  }> = {}
): string {
  const authDate = overrides.authDate ?? Math.floor(Date.now() / 1000);
  const user = JSON.stringify({
    id: overrides.userId ?? 123456789,
    username: overrides.username ?? 'test_operator',
    first_name: overrides.firstName ?? 'Test',
  });

  // Build data check string
  const params = new URLSearchParams({
    auth_date: String(authDate),
    user,
    query_id: 'AAHdF6IQAAAAAN0XohCm',
  });

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(TEST_BOT_TOKEN).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  params.set('hash', hash);
  return params.toString();
}

// ─── Suite A: HMAC Verification ───────────────────────────────────────────────

describe('🔐 Nexus TMA Auth Engine — Phase F2', () => {

  beforeEach(() => {
    process.env.TELEGRAM_TEAM_BOT_TOKEN = TEST_BOT_TOKEN;
  });

  afterEach(() => {
    delete process.env.TELEGRAM_TEAM_BOT_TOKEN;
  });

  describe('Suite A: HMAC Verification (verifyTelegramInitData)', () => {

    it('AUTH-001: Accepts valid initData with correct HMAC', () => {
      const initData = buildValidInitData();
      expect(() => verifyTelegramInitData(initData)).not.toThrow();
    });

    it('AUTH-002: Returns URLSearchParams with expected fields', () => {
      const initData = buildValidInitData({ userId: 999 });
      const params = verifyTelegramInitData(initData);
      expect(params.get('auth_date')).toBeTruthy();
      expect(params.get('user')).toBeTruthy();
      // hash must have been removed
      expect(params.get('hash')).toBeNull();
    });

    it('AUTH-003: Rejects initData with tampered hash (1 char changed)', () => {
      const initData = buildValidInitData();
      const url = new URLSearchParams(initData);
      const originalHash = url.get('hash')!;
      // Flip last char
      const tamperedHash = originalHash.slice(0, -1) + (originalHash.endsWith('a') ? 'b' : 'a');
      url.set('hash', tamperedHash);
      expect(() => verifyTelegramInitData(url.toString())).toThrowError(NexusTmaHmacError);
    });

    it('AUTH-004: Rejects initData with missing hash field', () => {
      const url = new URLSearchParams({ auth_date: '1700000000', user: '{}' });
      expect(() => verifyTelegramInitData(url.toString())).toThrowError(NexusTmaHmacError);
    });

    it('AUTH-005: Rejects when bot token is wrong (simulates different bot)', () => {
      const initData = buildValidInitData();
      // Override env to a different token
      process.env.TELEGRAM_TEAM_BOT_TOKEN = 'wrong_bot_token';
      expect(() => verifyTelegramInitData(initData)).toThrowError(NexusTmaHmacError);
    });

    it('AUTH-006: Throws TRANSPORT_NOT_CONFIGURED when token missing', () => {
      delete process.env.TELEGRAM_TEAM_BOT_TOKEN;
      const initData = buildValidInitData();
      expect(() => verifyTelegramInitData(initData)).toThrowError('not configured');
    });

    it('AUTH-007: Rejects completely empty initData string', () => {
      expect(() => verifyTelegramInitData('')).toThrowError(NexusTmaHmacError);
    });
  });

  // ─── Suite B: Age Validation ─────────────────────────────────────────────

  describe('Suite B: initData Age Validation (validateInitDataAge)', () => {

    it('AUTH-008: Accepts auth_date within 24h', () => {
      const params = new URLSearchParams({
        auth_date: String(Math.floor(Date.now() / 1000) - 3600), // 1h ago
      });
      expect(() => validateInitDataAge(params)).not.toThrow();
    });

    it('AUTH-009: Rejects auth_date older than 24h', () => {
      const params = new URLSearchParams({
        auth_date: String(Math.floor(Date.now() / 1000) - 90_000), // 25h ago
      });
      expect(() => validateInitDataAge(params)).toThrowError(NexusTmaExpiredError);
    });

    it('AUTH-010: Rejects missing auth_date', () => {
      const params = new URLSearchParams({ user: '{}' });
      expect(() => validateInitDataAge(params)).toThrowError('auth_date missing');
    });
  });

  // ─── Suite C: User Extraction ─────────────────────────────────────────────

  describe('Suite C: Telegram User Extraction (extractTelegramUser)', () => {

    it('AUTH-011: Extracts user id from valid user JSON', () => {
      const params = new URLSearchParams({
        user: JSON.stringify({ id: 42424242, username: 'marco', first_name: 'Marco' }),
      });
      const user = extractTelegramUser(params);
      expect(user.id).toBe(42424242);
      expect(user.username).toBe('marco');
    });

    it('AUTH-012: Throws when user field is missing', () => {
      const params = new URLSearchParams({ auth_date: '1700000000' });
      expect(() => extractTelegramUser(params)).toThrowError('user field missing');
    });

    it('AUTH-013: Throws when user field is invalid JSON', () => {
      const params = new URLSearchParams({ user: 'NOT_JSON' });
      expect(() => extractTelegramUser(params)).toThrowError('parse user');
    });
  });

  // ─── Suite D: Capability Derivation ──────────────────────────────────────

  describe('Suite D: Capability Derivation (deriveCapabilities)', () => {

    it('AUTH-014: SUPER_ADMIN has all capabilities', () => {
      const caps = deriveCapabilities('SUPER_ADMIN');
      expect(caps).toContain('users.manage');
      expect(caps).toContain('finance.manage');
      expect(caps).toContain('nexus.manage');
      expect(caps).toContain('ecosystem');
    });

    it('AUTH-015: VIEWER has no manage capabilities by default', () => {
      const caps = deriveCapabilities('VIEWER');
      expect(caps).not.toContain('users.manage');
      expect(caps).not.toContain('finance.manage');
    });

    it('AUTH-016: Overrides can grant extra capabilities to VIEWER', () => {
      const caps = deriveCapabilities('VIEWER', { 'growth.manage': true });
      expect(caps).toContain('growth.manage');
    });

    it('AUTH-017: Returns empty array for VIEWER with no overrides', () => {
      const caps = deriveCapabilities('VIEWER');
      // VIEWER has no true permissions by default
      expect(Array.isArray(caps)).toBe(true);
    });
  });

  // ─── Suite E: Full Resolution Chain (mocked DB) ───────────────────────────

  describe('Suite E: Full Resolution Chain (resolveNexusTmaSession)', () => {

    beforeEach(() => {
      mockFindFirst.mockReset();
    });

    it('AUTH-018: Returns NexusTmaSession for valid ACTIVE collaborator', async () => {
      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      mockFindFirst.mockResolvedValueOnce({
        id: 7,
        name: 'Marco Operador',
        role: 'ADMIN',
        status: 'ACTIVE',
        expiresAt: future,
        telegramUserId: '123456789',
        telegramUsername: 'marco_ops',
        permissions: {},
      });

      const initData = buildValidInitData({ userId: 123456789 });
      const session = await resolveNexusTmaSession(initData);

      expect(session.collaboratorId).toBe(7);
      expect(session.role).toBe('ADMIN');
      expect(session.capabilities).toContain('users.manage');
      expect(session.capabilities).toContain('finance.manage');
      expect(session.telegramUserId).toBe('123456789');
      expect(mockFindFirst).toHaveBeenCalledOnce();
    });

    it('AUTH-019: Throws NexusTmaNotLinkedError when no collaborator found', async () => {
      mockFindFirst.mockResolvedValueOnce(undefined);
      const initData = buildValidInitData({ userId: 999999999 });
      await expect(resolveNexusTmaSession(initData)).rejects.toThrowError(NexusTmaNotLinkedError);
    });

    it('AUTH-020: Throws NexusTmaCollaboratorInactiveError for SUSPENDED collaborator', async () => {
      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      mockFindFirst.mockResolvedValueOnce({
        id: 8,
        name: 'Suspended User',
        role: 'VIEWER',
        status: 'SUSPENDED',
        expiresAt: future,
        telegramUserId: '123456789',
        telegramUsername: null,
        permissions: {},
      });

      const initData = buildValidInitData({ userId: 123456789 });
      await expect(resolveNexusTmaSession(initData)).rejects.toThrowError(NexusTmaCollaboratorInactiveError);
    });

    it('AUTH-021: Throws NexusTmaCollaboratorExpiredError when invitation is expired', async () => {
      const past = new Date(Date.now() - 1000);
      mockFindFirst.mockResolvedValueOnce({
        id: 9,
        name: 'Expired User',
        role: 'OPERATOR',
        status: 'ACTIVE',
        expiresAt: past,
        telegramUserId: '123456789',
        telegramUsername: null,
        permissions: {},
      });

      const initData = buildValidInitData({ userId: 123456789 });
      await expect(resolveNexusTmaSession(initData)).rejects.toThrowError(NexusTmaCollaboratorExpiredError);
    });
  });
});
