/**
 * 🧪 Tests: NexusTeamTransport — Phase 1
 * apps/dashboard/src/lib/nexus/__tests__/telegram-team-transport.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NexusTeamTransport } from '../telegram-team-transport';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeEnv(overrides: Record<string, string | undefined> = {}) {
  // Snapshot originals
  const snapshot: Record<string, string | undefined> = {};
  const MANAGED_KEYS = ['TELEGRAM_TEAM_BOT_TOKEN', 'TELEGRAM_TEAM_WEBHOOK_SECRET', 'NEXUS_TMA_URL', ...Object.keys(overrides)];
  for (const k of MANAGED_KEYS) snapshot[k] = process.env[k];

  // Apply defaults + overrides
  process.env.TELEGRAM_TEAM_BOT_TOKEN = 'test_team_token_123';
  process.env.TELEGRAM_TEAM_WEBHOOK_SECRET = 'abcdef1234567890abcdef1234567890';
  process.env.NEXUS_TMA_URL = 'https://nexus.pandoras.finance';

  for (const [key, val] of Object.entries(overrides)) {
    if (val === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = val;
    }
  }

  return () => {
    // Restore
    for (const k of MANAGED_KEYS) {
      if (snapshot[k] === undefined) delete process.env[k];
      else process.env[k] = snapshot[k];
    }
  };
}

// ─── Suite A: Constructor fail-closed ────────────────────────────────────────

describe('🤖 NexusTeamTransport — Phase 1 · Transport Layer', () => {

  describe('Suite A: Constructor Fail-Closed', () => {
    it('TRANSPORT-001: Throws if TELEGRAM_TEAM_BOT_TOKEN is missing', () => {
      const restore = makeEnv({ TELEGRAM_TEAM_BOT_TOKEN: undefined });
      expect(() => new NexusTeamTransport()).toThrow(
        'TELEGRAM_TEAM_BOT_TOKEN is not configured'
      );
      restore();
    });

    it('TRANSPORT-002: Initializes correctly when token is provided', () => {
      const restore = makeEnv();
      expect(() => new NexusTeamTransport()).not.toThrow();
      restore();
    });

    it('TRANSPORT-003: Accepts an explicit token (overrides env)', () => {
      const restore = makeEnv({ TELEGRAM_TEAM_BOT_TOKEN: undefined });
      expect(() => new NexusTeamTransport('explicit_token_xyz')).not.toThrow();
      restore();
    });
  });

  // ─── Suite B: Webhook Secret Validation ──────────────────────────────────

  describe('Suite B: Webhook Secret Validation', () => {
    beforeEach(() => {
      process.env.TELEGRAM_TEAM_WEBHOOK_SECRET = 'abcdef1234567890abcdef1234567890';
    });

    afterEach(() => {
      delete process.env.TELEGRAM_TEAM_WEBHOOK_SECRET;
    });

    it('TRANSPORT-004: Accepts exact matching secret', () => {
      expect(
        NexusTeamTransport.validateWebhookSecret('abcdef1234567890abcdef1234567890')
      ).toBe(true);
    });

    it('TRANSPORT-005: Rejects tampered secret (one character different)', () => {
      expect(
        NexusTeamTransport.validateWebhookSecret('abcdef1234567890abcdef123456789X')
      ).toBe(false);
    });

    it('TRANSPORT-006: Rejects null / missing header', () => {
      expect(NexusTeamTransport.validateWebhookSecret(null)).toBe(false);
    });

    it('TRANSPORT-007: Rejects empty string', () => {
      expect(NexusTeamTransport.validateWebhookSecret('')).toBe(false);
    });

    it('TRANSPORT-008: Rejects when env secret is not set', () => {
      delete process.env.TELEGRAM_TEAM_WEBHOOK_SECRET;
      expect(
        NexusTeamTransport.validateWebhookSecret('abcdef1234567890abcdef1234567890')
      ).toBe(false);
    });

    it('TRANSPORT-009: Rejects secrets with different lengths (avoids padding oracle)', () => {
      expect(
        NexusTeamTransport.validateWebhookSecret('short')
      ).toBe(false);
    });
  });

  // ─── Suite C: sendMessage HTTP contract ──────────────────────────────────

  describe('Suite C: sendMessage API Contract', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;
    let transport: NexusTeamTransport;
    let restore: () => void;

    beforeEach(() => {
      restore = makeEnv();
      transport = new NexusTeamTransport();
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, result: {} }),
        text: async () => 'OK',
      } as Response);
    });

    afterEach(() => {
      fetchSpy.mockRestore();
      restore();
    });

    it('TRANSPORT-010: Calls Telegram sendMessage API with correct URL', async () => {
      await transport.sendMessage({ chat_id: 12345, text: 'Hello Team' });
      expect(fetchSpy).toHaveBeenCalledOnce();
      const url = fetchSpy.mock.calls[0]![0] as string;
      expect(url).toContain('/sendMessage');
      expect(url).toContain('test_team_token_123');
    });

    it('TRANSPORT-011: Sends chat_id and text in the request body', async () => {
      await transport.sendMessage({
        chat_id: 99999,
        text: 'Operation requires approval',
        parse_mode: 'HTML',
      });
      const bodyStr = fetchSpy.mock.calls[0]![1]?.body as string;
      const body = JSON.parse(bodyStr);
      expect(body.chat_id).toBe(99999);
      expect(body.text).toBe('Operation requires approval');
      expect(body.parse_mode).toBe('HTML');
    });

    it('TRANSPORT-012: Throws when Telegram returns non-ok response', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request: message is too long',
      } as Response);

      await expect(
        transport.sendMessage({ chat_id: 1, text: 'x' })
      ).rejects.toThrow('Telegram sendMessage failed');
    });
  });

  // ─── Suite D: Isolation guarantee ────────────────────────────────────────

  describe('Suite D: Isolation from Other Bot Tokens', () => {
    it('TRANSPORT-013: NEVER uses TELEGRAM_BOT_TOKEN (Hermes Client Bot)', () => {
      const restore = makeEnv({ TELEGRAM_BOT_TOKEN: 'hermes_client_bot_token' });
      // Even if TELEGRAM_BOT_TOKEN is present, the team transport ignores it
      const t = new NexusTeamTransport();
      // Inspect the apiBase — must not contain hermes token
      expect((t as unknown as { apiBase: string }).apiBase).not.toContain('hermes_client_bot_token');
      expect((t as unknown as { apiBase: string }).apiBase).toContain('test_team_token_123');
      restore();
    });
  });
});
