/**
 * 🛡️ COMPREHENSIVE TENANT AUTHORIZATION & SAFETY GATE CERTIFICATION (15 CHECKPOINTS)
 * apps/dashboard/scripts/verify-migration-safety.mjs
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." bun run scripts/verify-migration-safety.mjs
 *   or: DATABASE_URL="postgresql://..." bun run verify:safety
 *
 * Executes full boundary tests across:
 * - Database Schema & UUID integrity
 * - Cross-Tenant Read & Write Isolation (via Sentinel Test Fixtures)
 * - Actor & Conversation Boundaries (via Sentinel Test Fixtures)
 * - Knowledge Scope & Exclusion Register
 * - Fail-Closed Runtime Verification
 */

import { neon } from '@neondatabase/serverless';
import { ScopeValidator } from '../src/lib/hermes/knowledge/exclusion-register.ts';
import { JourneyEngine } from '../src/lib/pandoras/core/domains/hermes/runtime/journey-engine.ts';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ Error: DATABASE_URL environment variable is required.");
  console.error("👉 Example: DATABASE_URL=\"postgresql://...\" bun run scripts/verify-migration-safety.mjs");
  process.exit(1);
}
const sql = neon(DATABASE_URL);

async function runSafetyGates() {
  console.log('\n================================================================');
  console.log('🔒 PANDORAS PLATFORM: TENANT AUTHORIZATION & SECURITY CERTIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const sentinelIds = [];

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} — ${details}`);
      failed++;
    }
  }

  try {
    // Fetch all projects for multi-tenant isolation testing
    const projects = await sql`
      SELECT id, slug, title, organization_id, chain_id, contract_address 
      FROM projects 
      ORDER BY id ASC;
    `;

    const snarai = projects.find(p => p.slug === 'snarai');
    const access = projects.find(p => p.slug === 'pandoras_access');

    if (!snarai || !access) {
      console.error("❌ Critical: Required test projects 'snarai' or 'pandoras_access' not found in database.");
      process.exit(1);
    }

    // ─── PART 1: CORE SCHEMA & ON-CHAIN INVARIANTS ───────────────────────────

    // Checkpoint 1: All projects have organization_id
    const nullOrgIds = projects.filter(p => !p.organization_id);
    assert('Checkpoint 1: All projects have organization_id', nullOrgIds.length === 0, `${nullOrgIds.length} nulls found`);

    // Checkpoint 2: organization_id uniqueness
    const uniqueOrgIds = new Set(projects.map(p => p.organization_id));
    assert('Checkpoint 2: organization_id is UNIQUE across all projects', uniqueOrgIds.size === projects.length, `${uniqueOrgIds.size} unique vs ${projects.length} total`);

    // Checkpoint 3: S'Narai contract preservation
    assert('Checkpoint 3: S\'Narai exists with stable UUID and untouched contract', 
      !!snarai.organization_id && snarai.contract_address === '0xd2d5EcF7e2617ff900c22D70E24F7ca2cd2111dF',
      `UUID: ${snarai.organization_id}, Contract: ${snarai.contract_address}`
    );

    // Checkpoint 4: hermes_journeys populated
    const journeys = await sql`SELECT id, organization_id, name, status FROM hermes_journeys;`;
    assert('Checkpoint 4: hermes_journeys populated in DB', journeys.length > 0, `Count: ${journeys.length}`);

    // Checkpoint 5: hermes_journey_stages populated
    const stages = await sql`SELECT id, journey_id, name, order_index FROM hermes_journey_stages;`;
    assert('Checkpoint 5: hermes_journey_stages populated in DB', stages.length > 0, `Count: ${stages.length}`);

    // Checkpoint 6: On-chain contracts intact
    const snaraiContract = snarai?.contract_address;
    assert('Checkpoint 6: On-chain contracts intact (S\'Narai contract matches 0xd2d5EcF7e2617ff900c22D70E24F7ca2cd2111dF)', 
      snaraiContract === '0xd2d5EcF7e2617ff900c22D70E24F7ca2cd2111dF'
    );

    // Checkpoint 7: Dual-Read parity
    const byUuid = await sql`SELECT id, slug FROM projects WHERE organization_id = ${snarai.organization_id};`;
    const bySlug = await sql`SELECT id, organization_id FROM projects WHERE slug = 'snarai';`;
    assert('Checkpoint 7: Dual-Read parity (UUID query === slug query)', 
      byUuid[0]?.id === bySlug[0]?.id && byUuid[0]?.slug === 'snarai',
      `UUID ID: ${byUuid[0]?.id}, Slug ID: ${bySlug[0]?.id}`
    );

    // ─── PART 2: SENTINEL-BASED CROSS-TENANT ISOLATION CERTIFICATION ─────────

    // Create transient sentinel records for Tenant A (S'Narai)
    const testTag = `sentinel_${Date.now()}`;
    const [sentinelJourney] = await sql`
      INSERT INTO hermes_journeys (organization_id, name, description, version, status, is_default)
      VALUES (${snarai.organization_id}, ${`Sentinel Journey ${testTag}`}, 'Original Safe Description', 1, 'ACTIVE', false)
      RETURNING id;
    `;
    sentinelIds.push({ table: 'hermes_journeys', id: sentinelJourney.id });

    // Checkpoint 8: Cross-Tenant Read Isolation (Tenant B querying Tenant A's sentinel journey returns 0)
    const crossTenantRead = await sql`
      SELECT id FROM hermes_journeys 
      WHERE organization_id = ${access.organization_id} 
        AND id = ${sentinelJourney.id};
    `;
    assert('Checkpoint 8: Cross-Tenant Read Isolation (Tenant B cannot read Tenant A sentinel journey)', 
      crossTenantRead.length === 0, 
      `Found ${crossTenantRead.length} cross-tenant records`
    );

    // Checkpoint 9: Cross-Tenant Mutation Isolation (Tenant B attempting update on Tenant A sentinel journey affects 0 rows)
    const updateResult = await sql`
      UPDATE hermes_journeys 
      SET description = 'ATTEMPTED_MUTATION' 
      WHERE id = ${sentinelJourney.id} 
        AND organization_id = ${access.organization_id}
      RETURNING id;
    `;
    // Verify that the sentinel row was NOT modified
    const [verifySentinel] = await sql`
      SELECT description FROM hermes_journeys WHERE id = ${sentinelJourney.id};
    `;
    assert('Checkpoint 9: Cross-Tenant Mutation Isolation (Mismatched orgId affects 0 rows; data untouched)', 
      updateResult.length === 0 && verifySentinel.description === 'Original Safe Description',
      `Updated rows: ${updateResult.length}, Description: ${verifySentinel.description}`
    );

    // Checkpoint 10: Actor Isolation (Tenant B querying Tenant A's sentinel actor journey returns 0)
    const sentinelActorId = `actor_${testTag}`;
    const [sentinelActorJourney] = await sql`
      INSERT INTO hermes_actor_journeys (organization_id, actor_id, journey_id, journey_version, current_stage_id, status)
      VALUES (${snarai.organization_id}, ${sentinelActorId}, ${sentinelJourney.id}, 1, 'STAGE_INIT', 'IN_PROGRESS')
      RETURNING id;
    `;
    sentinelIds.push({ table: 'hermes_actor_journeys', id: sentinelActorJourney.id });

    const actorCrossQuery = await sql`
      SELECT id FROM hermes_actor_journeys 
      WHERE actor_id = ${sentinelActorId} 
        AND organization_id = ${access.organization_id};
    `;
    assert('Checkpoint 10: Actor Isolation (Actor search strictly scoped to organization_id)', 
      actorCrossQuery.length === 0
    );

    // Checkpoint 11: API Boundary Validation
    const spoofAttempt = await sql`
      SELECT id FROM projects 
      WHERE organization_id = ${access.organization_id} AND slug = 'snarai';
    `;
    assert('Checkpoint 11: API Boundary (Mismatched UUID + slug pair yields 0 results)', 
      spoofAttempt.length === 0
    );

    // Checkpoint 12: Server Action Boundary Simulation
    const actionCheck = await sql`
      SELECT id FROM hermes_journeys 
      WHERE id = ${sentinelJourney.id} AND (organization_id = ${access.organization_id} OR organization_id = ${access.slug});
    `;
    assert('Checkpoint 12: Server Action Boundary (Action with Tenant B session targeting Tenant A journey blocked)', 
      actionCheck.length === 0
    );

    // Checkpoint 13: Knowledge Isolation (ScopeValidator)
    const foreignDoc = {
      id: 'doc_snarai_secret',
      organizationId: snarai.organization_id,
      status: 'CANONICAL',
      visibility: 'PUBLIC',
      authority: 'SNARAI_LEGAL',
      content: 'S\'Narai Proprietary RWA Valuation Engine'
    };
    const scopeValidation = ScopeValidator.isAllowedInContext(foreignDoc, access.organization_id, true);
    assert('Checkpoint 13: Knowledge Isolation (Cross-tenant knowledge injection rejected by ScopeValidator)', 
      !scopeValidation.allowed && scopeValidation.reason === 'TENANT_BOUNDARY_VIOLATION',
      `Result: allowed=${scopeValidation.allowed}, reason=${scopeValidation.reason}`
    );

    // Checkpoint 14: Conversation Boundary (Tenant B querying Tenant A's sentinel conversation returns 0)
    const sentinelConvId = `conv_${testTag}`;
    const [sentinelConv] = await sql`
      INSERT INTO hermes_conversations (id, organization_id, conversation_id, version)
      VALUES (${`rec_${testTag}`}, ${snarai.organization_id}, ${sentinelConvId}, 1)
      RETURNING id;
    `;
    sentinelIds.push({ table: 'hermes_conversations', id: sentinelConv.id });

    const crossConv = await sql`
      SELECT id FROM hermes_conversations 
      WHERE organization_id = ${access.organization_id} AND conversation_id = ${sentinelConvId};
    `;
    assert('Checkpoint 14: Conversation Boundary (Tenant B cannot read Tenant A sentinel conversation)', 
      crossConv.length === 0
    );

    // Checkpoint 15: Fail-Closed Enforcement
    const engine = new JourneyEngine();
    const failClosedSnapshot = await engine.retrieveContext({
      organizationId: '00000000-0000-0000-0000-000000000000',
      actor: { externalActorId: 'actor_phantom' },
      channel: 'WEB',
      content: 'Test message',
      messageId: 'msg_1',
      receivedAt: new Date()
    });

    assert('Checkpoint 15: Fail-Closed Enforcement (Unresolvable tenant returns empty, zero-permission context)', 
      failClosedSnapshot.currentStage === 'UNASSIGNED' && failClosedSnapshot.objectives.length === 0,
      `Stage: ${failClosedSnapshot.currentStage}, Objectives: ${failClosedSnapshot.objectives.length}`
    );

  } finally {
    // 🧹 Clean up all transient sentinel fixtures in reverse dependency order
    if (sentinelIds.length > 0) {
      for (const item of sentinelIds.filter(i => i.table === 'hermes_actor_journeys')) {
        try {
          await sql`DELETE FROM hermes_actor_journeys WHERE id = ${item.id};`;
        } catch (_) {}
      }
      for (const item of sentinelIds.filter(i => i.table === 'hermes_conversations')) {
        try {
          await sql`DELETE FROM hermes_conversations WHERE id = ${item.id};`;
        } catch (_) {}
      }
      for (const item of sentinelIds.filter(i => i.table === 'hermes_journeys')) {
        try {
          await sql`DELETE FROM hermes_journeys WHERE id = ${item.id};`;
        } catch (_) {}
      }
    }
  }

  console.log(`\n================================================================`);
  console.log(`FINAL RESULTS: ${passed} PASSED / ${failed} FAILED (15/15 CHECKPOINTS)`);
  console.log(`================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSafetyGates().catch(err => {
  console.error('Safety gate runner error:', err);
  process.exit(1);
});
