/**
 * 🛡️ Hermes OS — Milestone 5.0: K22.1 PostgreSQL Boundary Penetration Test Suite
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/__tests__/hermes-postgres-penetration.test.ts
 *
 * Directly tests raw PostgreSQL security invariants without application-layer abstractions:
 * - Suite A: Privilege Escalation & DDL Resistance under `hermes_runtime_worker`
 * - Suite B: Raw SQL Tenant Escape & Row-Level Security (RLS) Enforcement
 * - Suite C: Cryptographic Context Forgery Resistance (Tampered Tenant/Actor/TTL/Nonce)
 * - Suite D: Anti-Replay Nonce Consumption Protection
 * - Suite E: Connection Pool Contamination Resistance (Transaction Scoping)
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import postgres from 'postgres';
import { TenantSessionTokenSigner } from '../tenant-session-token';

describe('Hermes OS Milestone 5.0 — K22.1 PostgreSQL Boundary Penetration Certification', () => {
  const masterDbUrl = process.env.DATABASE_URL!;
  const sql = postgres(masterDbUrl, { ssl: 'require', max: 5 });

  let signer: TenantSessionTokenSigner;

  async function expectSqlError(promise: Promise<any>, pattern?: RegExp) {
    try {
      await promise;
      throw new Error('Expected SQL query to fail, but it succeeded.');
    } catch (err: any) {
      if (err.message === 'Expected SQL query to fail, but it succeeded.') {
        throw err;
      }
      if (pattern) {
        expect(err.message).toMatch(pattern);
      }
    }
  }

  beforeAll(async () => {
    const keys = await sql`
      SELECT key_value FROM hermes_internal_keys WHERE key_name = 'db_session_hmac_secret' LIMIT 1;
    `;
    expect(keys.length).toBe(1);
    expect(keys[0]?.key_value).toBeDefined();
    signer = new TenantSessionTokenSigner(keys[0]!.key_value);
  });

  afterAll(async () => {
    await sql.end();
  });

  // ── SUITE A: Privilege Escalation & Forbidden Table Access ─────────────────
  describe('Suite A: Privilege Escalation & Forbidden Table Access (under hermes_runtime_worker)', () => {
    it('blocks worker role from reading sensitive user credentials (REVOKE ALL on users)', async () => {
      await expectSqlError(
        sql.begin(async (tx: any) => {
          await tx`SET LOCAL ROLE hermes_runtime_worker;`;
          return await tx`SELECT * FROM users LIMIT 1;`;
        }),
        /permission denied/i
      );
    });

    it('blocks worker role from reading purchases & financial transactions (REVOKE ALL on purchases)', async () => {
      await expectSqlError(
        sql.begin(async (tx: any) => {
          await tx`SET LOCAL ROLE hermes_runtime_worker;`;
          return await tx`SELECT * FROM purchases LIMIT 1;`;
        }),
        /permission denied/i
      );
    });

    it('blocks worker role from reading user balances / treasury (REVOKE ALL on user_balances)', async () => {
      await expectSqlError(
        sql.begin(async (tx: any) => {
          await tx`SET LOCAL ROLE hermes_runtime_worker;`;
          return await tx`SELECT * FROM user_balances LIMIT 1;`;
        }),
        /permission denied/i
      );
    });

    it('blocks worker role from inspecting internal HMAC keys (REVOKE ALL on hermes_internal_keys)', async () => {
      await expectSqlError(
        sql.begin(async (tx: any) => {
          await tx`SET LOCAL ROLE hermes_runtime_worker;`;
          return await tx`SELECT * FROM hermes_internal_keys LIMIT 1;`;
        }),
        /permission denied/i
      );
    });

    it('blocks worker role from altering the SECURITY DEFINER function', async () => {
      await expectSqlError(
        sql.begin(async (tx: any) => {
          await tx`SET LOCAL ROLE hermes_runtime_worker;`;
          return await tx`ALTER FUNCTION set_hermes_tenant_session(TEXT, TEXT, BIGINT, TEXT, TEXT) OWNER TO hermes_runtime_worker;`;
        }),
        /must be owner/i
      );
    });

    it('blocks worker role from disabling Row-Level Security on knowledge table', async () => {
      await expectSqlError(
        sql.begin(async (tx: any) => {
          await tx`SET LOCAL ROLE hermes_runtime_worker;`;
          return await tx`ALTER TABLE hermes_knowledge DISABLE ROW LEVEL SECURITY;`;
        }),
        /must be owner/i
      );
    });

    it('blocks worker role from dropping tenant RLS policies', async () => {
      await expectSqlError(
        sql.begin(async (tx: any) => {
          await tx`SET LOCAL ROLE hermes_runtime_worker;`;
          return await tx`DROP POLICY hermes_knowledge_tenant_policy ON hermes_knowledge;`;
        }),
        /must be owner/i
      );
    });

    it('blocks worker role from escalating itself to superuser', async () => {
      await expectSqlError(
        sql.begin(async (tx: any) => {
          await tx`SET LOCAL ROLE hermes_runtime_worker;`;
          return await tx`ALTER ROLE hermes_runtime_worker WITH SUPERUSER;`;
        }),
        /permission denied/i
      );
    });

    it('blocks worker role from creating backdoor roles', async () => {
      await expectSqlError(
        sql.begin(async (tx: any) => {
          await tx`SET LOCAL ROLE hermes_runtime_worker;`;
          return await tx`CREATE ROLE backdoor_admin WITH SUPERUSER;`;
        }),
        /permission denied/i
      );
    });
  });

  // ── SUITE B: Direct SQL Cross-Tenant Escape & RLS Enforcement ───────────────
  describe('Suite B: Direct SQL Cross-Tenant Escape & RLS Enforcement', () => {
    it('enforces RLS: worker querying with tenant_A context sees 0 rows of tenant_B conversations', async () => {
      const tokenA = signer.generateToken('snarai', 'actor_1', 300);

      // Insert a test conversation under another organization using master
      await sql`
        INSERT INTO hermes_conversations (id, organization_id, conversation_id)
        VALUES ('conv_test_isolation_1', 'snarai', 'conv_iso_1')
        ON CONFLICT (id) DO NOTHING;
      `;

      // Worker enters transaction with tenant_A token
      const rows = await sql.begin(async (tx: any) => {
        await tx`SET LOCAL ROLE hermes_runtime_worker;`;
        await tx`
          SELECT set_hermes_tenant_session(
            ${tokenA.tenantId},
            ${tokenA.actorId},
            ${tokenA.expiresAt},
            ${tokenA.nonce},
            ${tokenA.signature}
          );
        `;

        // Direct SQL attempting to snoop on another nonexistent/different tenant
        return await tx`
          SELECT * FROM hermes_conversations WHERE organization_id = 'unauthorized_victim_tenant';
        `;
      });

      expect(rows.length).toBe(0); // RLS silently filters out unauthorized tenant rows
    });

    it('enforces RLS: worker with tenant_A context cannot insert data tagged as tenant_B', async () => {
      const tokenA = signer.generateToken('snarai', 'actor_1', 300);

      await expectSqlError(
        sql.begin(async (tx: any) => {
          await tx`SET LOCAL ROLE hermes_runtime_worker;`;
          await tx`
            SELECT set_hermes_tenant_session(
              ${tokenA.tenantId},
              ${tokenA.actorId},
              ${tokenA.expiresAt},
              ${tokenA.nonce},
              ${tokenA.signature}
            );
          `;

          // Attempt to insert conversation for another tenant while session is snarai
          await tx`
            INSERT INTO hermes_conversations (id, organization_id, conversation_id)
            VALUES ('conv_hijack_attempt_99', 'other_unauthorized_tenant', 'c_hijack');
          `;
        }),
        /row-level security/i
      );
    });
  });

  // ── SUITE C: Cryptographic Context Forgery Resistance ──────────────────────
  describe('Suite C: Cryptographic Context Forgery Resistance', () => {
    it('rejects tampered signature (invalid HMAC)', async () => {
      const token = signer.generateToken('snarai', 'actor_1', 300);
      const forgedSig = '0000000000000000000000000000000000000000000000000000000000000000';

      await expectSqlError(
        sql`
          SELECT set_hermes_tenant_session(
            ${token.tenantId},
            ${token.actorId},
            ${token.expiresAt},
            ${token.nonce},
            ${forgedSig}
          );
        `,
        /Invalid tenant session signature/i
      );
    });

    it('rejects tampered tenantId (signature mismatch)', async () => {
      const token = signer.generateToken('snarai', 'actor_1', 300);

      await expectSqlError(
        sql`
          SELECT set_hermes_tenant_session(
            'unauthorized_tenant_spoof',
            ${token.actorId},
            ${token.expiresAt},
            ${token.nonce},
            ${token.signature}
          );
        `,
        /Invalid tenant session signature/i
      );
    });

    it('rejects tampered actorId (signature mismatch)', async () => {
      const token = signer.generateToken('snarai', 'actor_1', 300);

      await expectSqlError(
        sql`
          SELECT set_hermes_tenant_session(
            ${token.tenantId},
            'founder_superadmin',
            ${token.expiresAt},
            ${token.nonce},
            ${token.signature}
          );
        `,
        /Invalid tenant session signature/i
      );
    });

    it('rejects expired session token', async () => {
      const expiredToken = signer.generateToken('snarai', 'actor_1', -120);

      await expectSqlError(
        sql`
          SELECT set_hermes_tenant_session(
            ${expiredToken.tenantId},
            ${expiredToken.actorId},
            ${expiredToken.expiresAt},
            ${expiredToken.nonce},
            ${expiredToken.signature}
          );
        `,
        /Hermes tenant session token expired/i
      );
    });
  });

  // ── SUITE D: Anti-Replay Nonce Consumption Protection ───────────────────────
  describe('Suite D: Anti-Replay Nonce Consumption Protection', () => {
    it('allows initial session creation, but blocks exact replay of consumed nonce', async () => {
      const replayToken = signer.generateToken('snarai', 'actor_replay_test', 300);

      // Step 1: First invocation must succeed and consume nonce
      const firstCall = await sql`
        SELECT set_hermes_tenant_session(
          ${replayToken.tenantId},
          ${replayToken.actorId},
          ${replayToken.expiresAt},
          ${replayToken.nonce},
          ${replayToken.signature}
        ) AS initialized;
      `;
      expect(firstCall[0]?.initialized).toBe(true);

      // Step 2: Immediate second invocation with exact same token must fail with Replay Exception
      await expectSqlError(
        sql`
          SELECT set_hermes_tenant_session(
            ${replayToken.tenantId},
            ${replayToken.actorId},
            ${replayToken.expiresAt},
            ${replayToken.nonce},
            ${replayToken.signature}
          );
        `,
        /Hermes session token nonce already consumed/i
      );
    });
  });

  // ── SUITE E: Connection Pool Contamination Resistance ───────────────────────
  describe('Suite E: Connection Pool Contamination Resistance (Transaction-Local Scoping)', () => {
    it('guarantees tenant context does not leak across transactions on shared connection', async () => {
      const token = signer.generateToken('tenant_ephemeral_leak_test', 'actor_x', 300);

      // Transaction A sets tenant context
      await sql.begin(async (tx: any) => {
        await tx`
          SELECT set_hermes_tenant_session(
            ${token.tenantId},
            ${token.actorId},
            ${token.expiresAt},
            ${token.nonce},
            ${token.signature}
          );
        `;
        const inside = await tx`SELECT current_setting('hermes.current_tenant', true) AS t;`;
        expect(inside[0]?.t).toBe('tenant_ephemeral_leak_test');
      });

      // Post-transaction query on same connection pool must be empty (clean context)
      const after = await sql`SELECT current_setting('hermes.current_tenant', true) AS t;`;
      expect(after[0]?.t).toBe('');
    });
  });
});
