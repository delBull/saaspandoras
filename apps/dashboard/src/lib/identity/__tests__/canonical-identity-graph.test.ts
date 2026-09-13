/**
 * 🏛️ Test Suite — Canonical Identity Graph Core (F1)
 * apps/dashboard/src/lib/identity/__tests__/canonical-identity-graph.test.ts
 *
 * Invariants Verified:
 * 1. Canonical Identity ≠ Tenant Membership ≠ Role ≠ Capability ≠ Execution Authority.
 * 2. Strict 4-vector identifier normalization (Wallet, Email, Phone, Telegram).
 * 3. Anti-Auto-Merge & Collision Detection (Matching ≠ Proof).
 * 4. Verification confidence levels (VERIFIED, SELF_DECLARED, UNVERIFIED).
 * 5. Forensic audit event emission via SecurityAuditLogger.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CanonicalIdentityGraph } from '../canonical-identity-graph';
import { SecurityAuditLogger } from '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger';
import { db } from '@/db';

describe('🏛️ Canonical Identity Graph Core Suite (F1)', () => {
  // In-memory mock store to isolate from live Neon DB during unit tests
  let mockIdentities: any[] = [];
  let mockBindings: any[] = [];

  beforeEach(() => {
    mockIdentities = [];
    mockBindings = [];
    vi.restoreAllMocks();

    function extractPairs(sql: any): { field: string; val: string }[] {
      if (!sql) return [];
      const pairs: { field: string; val: string }[] = [];
      const chunks = sql.queryChunks || [];
      for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        if (c && c.name && chunks[i + 2] && chunks[i + 2].value !== undefined) {
          pairs.push({ field: c.name, val: String(chunks[i + 2].value) });
        }
        if (c && c.queryChunks) {
          pairs.push(...extractPairs(c));
        }
      }
      return pairs;
    }

    function matchCondition(id: any, where: any): boolean {
      if (!where) return true;
      const pairs = extractPairs(where);
      if (pairs.length === 0) return false;
      return pairs.some(({ field, val }) => {
        if (field === 'id') return id.id === val;
        if (field === 'wallet_address') return id.walletAddress === val;
        if (field === 'email') return id.email === val;
        if (field === 'phone') return id.phone === val || id.phone === `+${val}`;
        if (field === 'telegram_id') return id.telegramId === val;
        return false;
      });
    }

    // Mock db.query.marketingIdentities.findFirst
    (db.query as any).marketingIdentities = {
      findFirst: vi.fn(async ({ where }: any) => {
        if (!where) return mockIdentities[0] || null;
        return mockIdentities.find(id => matchCondition(id, where)) || null;
      }),
    };

    // Mock db.query.channelIdentityBindings.findFirst
    (db.query as any).channelIdentityBindings = {
      findFirst: vi.fn(async () => null),
    };

    // Mock db.insert
    (db as any).insert = vi.fn((table: any) => ({
      values: vi.fn((vals: any) => {
        if (vals.id && (vals.walletAddress || vals.email || vals.phone || vals.telegramId || vals.metadata)) {
          const newRow = { ...vals, createdAt: new Date(), updatedAt: new Date() };
          mockIdentities.push(newRow);
          return {
            returning: vi.fn(async () => [newRow]),
            catch: vi.fn(async () => undefined),
          };
        }
        mockBindings.push(vals);
        return {
          returning: vi.fn(async () => [vals]),
          catch: vi.fn(async () => undefined),
        };
      }),
    }));

    // Mock db.update
    (db as any).update = vi.fn(() => ({
      set: vi.fn((updateVals: any) => ({
        where: vi.fn(() => {
          const execute = async () => {
            if (mockIdentities.length > 0) {
              Object.assign(mockIdentities[0], updateVals, { updatedAt: new Date() });
              return [mockIdentities[0]];
            }
            return [];
          };
          return {
            returning: vi.fn(execute),
            then: (resolve: any, reject: any) => execute().then(resolve, reject),
            catch: (handler: any) => execute().catch(handler),
          };
        }),
      })),
    }));

    // Mock SecurityAuditLogger.logEvent spy
    vi.spyOn(SecurityAuditLogger, 'logEvent').mockResolvedValue('audit_event_hash' as any);
  });

  describe('1. Inviolable Boundary: ZERO Roles & Authority Returned', () => {
    it('returns strictly canonical identifiers and zero roles, permissions, or capabilities', async () => {
      const record = await CanonicalIdentityGraph.resolveCanonicalIdentity({
        type: 'wallet',
        value: '0x00C9F7ee6D1808c09b61E561Af6c787060BFE7C9',
      });

      expect(record).toBeDefined();
      expect(record!.identityId).toBeDefined();
      expect(record!.identifiers.wallet).toBe('0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9');

      // STRICT SECURITY INVARIANTS
      expect((record as any).role).toBeUndefined();
      expect((record as any).roles).toBeUndefined();
      expect((record as any).permissions).toBeUndefined();
      expect((record as any).capabilities).toBeUndefined();
      expect((record as any).isBoss).toBeUndefined();
      expect((record as any).isSuperAdmin).toBeUndefined();
      expect((record as any).tenantId).toBeUndefined();
      expect((record as any).organizationId).toBeUndefined();
    });
  });

  describe('2. Four-Vector Normalization & Resolution', () => {
    it('normalizes and resolves Wallet (hex casing & trimming)', async () => {
      const record = await CanonicalIdentityGraph.resolveCanonicalIdentity({
        type: 'wallet',
        value: '  0xAbC123dEf4567890123456789012345678901234  ',
        confidence: 'VERIFIED',
        verificationMethod: 'EIP_191_PROOF',
      });

      expect(record!.identifiers.wallet).toBe('0xabc123def4567890123456789012345678901234');
      expect(record!.verification.wallet?.status).toBe('VERIFIED');
      expect(record!.verification.wallet?.method).toBe('EIP_191_PROOF');
    });

    it('normalizes and resolves Email (lowercase & whitespace stripping)', async () => {
      const record = await CanonicalIdentityGraph.resolveCanonicalIdentity({
        type: 'email',
        value: '  Inversor.VIP@Snarai.Finance  ',
        confidence: 'VERIFIED',
        verificationMethod: 'MAGIC_LINK',
      });

      expect(record!.identifiers.email).toBe('inversor.vip@snarai.finance');
      expect(record!.verification.email?.status).toBe('VERIFIED');
    });

    it('normalizes and resolves Phone / WhatsApp (strip spaces, symbols, plus sign)', async () => {
      const record = await CanonicalIdentityGraph.resolveCanonicalIdentity({
        type: 'phone',
        value: '+52 (322) 274-1987',
        confidence: 'SELF_DECLARED',
        verificationMethod: 'WHATSAPP_INBOUND',
      });

      expect(record!.identifiers.phone).toBe('523222741987');
      expect(record!.verification.phone?.status).toBe('SELF_DECLARED');
    });

    it('normalizes and resolves Telegram (strips leading @ handle or keeps numeric id)', async () => {
      const record = await CanonicalIdentityGraph.resolveCanonicalIdentity({
        type: 'telegram',
        value: '@MardelBull',
        confidence: 'VERIFIED',
        verificationMethod: 'TELEGRAM_WEBAPP_INITDATA',
      });

      expect(record!.identifiers.telegramId).toBe('mardelbull');
      expect(record!.verification.telegram?.status).toBe('VERIFIED');
    });
  });

  describe('3. Anti-Auto-Merge & Collision Detection (Matching ≠ Proof)', () => {
    it('successfully attaches a new channel identifier when no conflict exists', async () => {
      const initial = await CanonicalIdentityGraph.resolveCanonicalIdentity({
        type: 'wallet',
        value: '0x1111111111111111111111111111111111111111',
      });

      const attachResult = await CanonicalIdentityGraph.attachIdentifier({
        identityId: initial!.identityId,
        identifier: {
          type: 'telegram',
          value: '798431743',
          confidence: 'VERIFIED',
          verificationMethod: 'SIGNED_LINK_INTENT',
        },
      });

      expect(attachResult.success).toBe(true);
      expect(attachResult.collision).toBeUndefined();
      expect(attachResult.identity.identifiers.telegramId).toBe('798431743');
      expect(attachResult.identity.verification.telegram?.status).toBe('VERIFIED');
    });

    it('REFUSES to auto-merge when identifier is already bound to another identity (emits IDENTITY_COLLISION_BLOCKED)', async () => {
      // Mock identity 1 owning email 'carlos@example.com'
      const id1 = {
        id: 'identity_user_1',
        walletAddress: '0x1111111111111111111111111111111111111111',
        email: 'carlos@example.com',
        phone: null,
        telegramId: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // Mock identity 2 (a different anonymous lead)
      const id2 = {
        id: 'identity_user_2',
        walletAddress: '0x2222222222222222222222222222222222222222',
        email: null,
        phone: null,
        telegramId: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockIdentities = [id1, id2];

      const attachResult = await CanonicalIdentityGraph.attachIdentifier({
        identityId: 'identity_user_2',
        identifier: {
          type: 'email',
          value: 'carlos@example.com',
        },
      });

      // 🛡️ SECURITY INVARIANT VERIFICATION
      expect(attachResult.success).toBe(false);
      expect(attachResult.collision).toBeDefined();
      expect(attachResult.collision?.existingIdentityId).toBe('identity_user_1');
      expect(attachResult.collision?.conflictIdentifier).toBe('carlos@example.com');
      expect(attachResult.collision?.conflictType).toBe('email');
      expect(attachResult.reason).toContain('COLLISION_DETECTED');

      // Verify audit event emission
      expect(SecurityAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'IDENTITY_COLLISION_BLOCKED',
          severity: 'WARN',
          policyDecision: 'DENY',
        })
      );
    });
  });

  describe('4. Audit Trail & Forensic Events', () => {
    it('emits IDENTITY_LINK_CREATED on new identity generation', async () => {
      await CanonicalIdentityGraph.resolveCanonicalIdentity({
        type: 'phone',
        value: '+52 322 274 1987',
      });

      expect(SecurityAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'IDENTITY_LINK_CREATED',
          severity: 'INFO',
          policyDecision: 'ALLOW',
        })
      );
    });

    it('emits IDENTITY_LINK_VERIFIED when attaching with confidence VERIFIED', async () => {
      const initial = {
        id: 'identity_verified_test',
        walletAddress: '0x3333333333333333333333333333333333333333',
        email: null,
        phone: null,
        telegramId: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockIdentities = [initial];

      await CanonicalIdentityGraph.attachIdentifier({
        identityId: 'identity_verified_test',
        identifier: {
          type: 'email',
          value: 'test@verified.com',
          confidence: 'VERIFIED',
          verificationMethod: 'EIP_191_SIGNATURE',
        },
        proof: {
          signature: '0xabcdef1234567890',
        },
      });

      expect(SecurityAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'IDENTITY_LINK_VERIFIED',
          severity: 'INFO',
          policyDecision: 'ALLOW',
        })
      );
    });
  });
});
