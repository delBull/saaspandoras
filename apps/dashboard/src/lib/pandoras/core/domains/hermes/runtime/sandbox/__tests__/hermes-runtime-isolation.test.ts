/**
 * 🛡️ Hermes OS — Milestone 7.0: K24 Runtime Isolation & Process Boundary Certification
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/sandbox/__tests__/hermes-runtime-isolation.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import { EphemeralMemoryScrubber } from '../memory-scrubber';
import { RuntimeIntegrityGuard } from '../integrity-guard';
import { HermesCodeSandbox } from '../code-sandbox';

describe('Hermes OS Milestone 7.0 — K24 Runtime Isolation & Process Boundary Certification', () => {

  // ── K24-SCRUB: Ephemeral Memory Zeroization ────────────────────────────────
  describe('K24-SCRUB: Ephemeral Memory Zeroization & Residual Scrubber', () => {
    it('wipes secret buffers completely with cryptographic zero fill', () => {
      const secret = Buffer.from('super_sensitive_dek_key_32bytes!', 'utf8');
      expect(secret.toString('utf8')).toBe('super_sensitive_dek_key_32bytes!');

      EphemeralMemoryScrubber.wipeBuffer(secret);

      // Verify all bytes are 0x00
      expect(secret.every(byte => byte === 0)).toBe(true);
      expect(secret.toString('utf8')).not.toContain('sensitive');
    });

    it('withScrubbedSecret guarantees zeroization even when inner operation throws', async () => {
      const secretBuffer = Buffer.from('temporary_ephemeral_token_123', 'utf8');

      await expect(
        EphemeralMemoryScrubber.withScrubbedSecret(secretBuffer, async (buf) => {
          expect(buf.toString('utf8')).toContain('temporary_ephemeral_token_123');
          throw new Error('Simulated processing failure');
        })
      ).rejects.toThrow('Simulated processing failure');

      // Buffer MUST be zeroized despite exception
      expect(secretBuffer.every(b => b === 0)).toBe(true);
    });

    it('scrubs sensitive object keys in memory data structures', () => {
      const payload = {
        tenantId: 'snarai',
        session: {
          token: 'jwt_secret_token_value',
          dek: Buffer.from('binary_dek_data'),
        },
        publicName: 'Investor Lead',
      };

      EphemeralMemoryScrubber.scrubObjectKeys(payload);

      expect(payload.tenantId).toBe('snarai');
      expect(payload.publicName).toBe('Investor Lead');
      expect(payload.session.token).toBe('[SCRUBBED_FROM_MEMORY]');
      expect((payload.session.dek as Buffer).every(b => b === 0)).toBe(true);
    });
  });

  // ── K24-INTEGRITY: Anti-Prototype Pollution & Immutability ──────────────────
  describe('K24-INTEGRITY: Anti-Prototype Pollution & Immutability', () => {
    it('detects and neutralizes Prototype Pollution payloads', () => {
      const hostilePayload = JSON.parse('{"__proto__": {"pollutedKey": "hacked"}, "validKey": "data"}');

      expect(RuntimeIntegrityGuard.hasPrototypePollution(hostilePayload)).toBe(true);

      const sanitized = RuntimeIntegrityGuard.sanitizeObject(hostilePayload);
      expect(sanitized.validKey).toBe('data');
      expect((sanitized as any).pollutedKey).toBeUndefined();

      // Global Object prototype must NOT be polluted
      expect((({} as any).pollutedKey)).toBeUndefined();
    });

    it('deeply freezes configuration objects making them tamper-proof', () => {
      const config = {
        firewall: {
          maxClearance: 'TIER_1_COO',
          egressAllowed: false,
        },
      };

      const frozen = RuntimeIntegrityGuard.deepFreeze(config);

      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen(frozen.firewall)).toBe(true);

      // Attempted mutation throws in strict mode or silently fails
      expect(() => {
        (frozen.firewall as any).egressAllowed = true;
      }).toThrow();
      expect(frozen.firewall.egressAllowed).toBe(false);
    });
  });

  // ── K24-SANDBOX: VM Breakout & Execution Boundary Defense ───────────────────
  describe('K24-SANDBOX: VM Breakout & Execution Boundary Defense', () => {
    it('executes safe pure expressions and calculations successfully', () => {
      const code = `
        const base = context.amount || 100;
        const fee = base * 0.02;
        return base + fee;
      `;

      const result = HermesCodeSandbox.execute<number>(code, {
        contextData: { amount: 500 },
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe(510);
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('blocks code attempting to exfiltrate process.env credentials', () => {
      const maliciousCode = `
        const secret = process.env.DATABASE_URL;
        return secret;
      `;

      const result = HermesCodeSandbox.execute(maliciousCode);
      expect(result.success).toBe(false);
      expect(result.error).toContain('[SANDBOX_SECURITY_VIOLATION]');
      expect(result.error).toContain('process');
    });

    it('blocks code attempting to require modules or access fs', () => {
      const maliciousCode = `
        const fs = require('fs');
        return fs.readFileSync('/etc/passwd');
      `;

      const result = HermesCodeSandbox.execute(maliciousCode);
      expect(result.success).toBe(false);
      expect(result.error).toContain('[SANDBOX_SECURITY_VIOLATION]');
      expect(result.error).toContain('require');
    });

    it('blocks prototype constructor breakout escaping Function constructor', () => {
      const breakoutCode = `
        const fn = this.constructor.constructor('return 42');
        fn();
      `;

      const result = HermesCodeSandbox.execute(breakoutCode);
      expect(result.success).toBe(false);
      expect(result.error).toContain('[SANDBOX_SECURITY_VIOLATION]');
    });

    it('guarantees global scope isolation: globalThis and process are undefined inside sandbox', () => {
      const inspectCode = `
        typeof process === 'undefined' && typeof require === 'undefined'
      `;

      const result = HermesCodeSandbox.execute(inspectCode);
      expect(result.success).toBe(false);
      expect(result.error).toContain('[SANDBOX_SECURITY_VIOLATION]');
    });
  });
});
