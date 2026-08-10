import { db } from '~/db';
import { sql } from 'drizzle-orm';
import { missions, outboxEvents } from '~/db/schema';
import { getOrganizationOverview, getActiveMissions, getPendingIntents, getMissionAuditTrail, approveIntent } from '~/app/growth-os/organizations/[id]/actions';
import { OutboxProcessor } from '~/lib/outbox/processor';

async function main() {
  console.log("🚀 SPRINT 27 UI END-TO-END TESTS (PROGRAMMATIC)");

  // Setup Test Data
  const orgId = "org_snarai_sprint22";
  const missionId = "mission_ui_test_" + Date.now();
  const intentId = "intent_ui_test_" + Date.now();

  console.log("\n--- [SETUP] Seeding Test Data ---");
  await db.insert(missions).values({
    id: missionId,
    organizationId: orgId,
    packId: "referral-trust",
    packVersion: "1.0.0",
    goalId: "goal_test_" + Date.now(),
    currentPhase: "governance_validation",
    status: "active",
    context: {},
    metrics: {},
    milestones: [],
    installedAt: new Date(),
    updatedAt: new Date()
  });

  // Inject a pending OperationalIntent via raw query (simulating Hermes emitting it)
  await db.execute(sql`
    INSERT INTO operational_intents (
      id, organization_id, mission_id, strategy_decision_id, pack_id, pack_version, objective, rationale, intent_type,
      constraints, approval_policy, status, created_at, updated_at
    ) VALUES (
      ${intentId}, ${orgId}, ${missionId}, 'strategy_test_' || EXTRACT(EPOCH FROM NOW())::TEXT, 'referral-trust', '1.0.0', 'Test Strategy Decision', 'Testing the Governance Center UX',
      'EXECUTE_CAMPAIGN', '[]', '{"required": true}', 'pending_approval', NOW(), NOW()
    )
  `);
  console.log("✅ Seeded Mission and Pending Intent");

  // TEST 27-L: OVERVIEW & MISSIONS
  console.log("\n--- [27-L] OVERVIEW & MISSIONS E2E ---");
  const overview = await getOrganizationOverview(orgId);
  console.log("Overview Data:", overview);
  if (overview.organizationId !== orgId) throw new Error("Overview failed");

  const activeMissions = await getActiveMissions(orgId);
  console.log(`Active Missions Count: ${activeMissions.length}`);
  if (activeMissions.length === 0) throw new Error("Missions failed to load");

  // TEST 27-F / 27-L: GOVERNANCE
  console.log("\n--- [27-L] GOVERNANCE E2E (Approve Intent) ---");
  let pending = await getPendingIntents(orgId);
  console.log(`Pending Intents before approval: ${pending.pendingIntents.length}`);
  const intentToApprove = pending.pendingIntents.find(i => i.intentId === intentId);
  if (!intentToApprove) throw new Error("Pending intent not found in Governance");

  const approveResult = await approveIntent(orgId, intentId, "Approved via Sprint 27 Script");
  console.log("Approve Result:", approveResult);
  if (!approveResult.success) throw new Error("Approval failed");

  pending = await getPendingIntents(orgId);
  const stillPending = pending.pendingIntents.find(i => i.intentId === intentId);
  if (stillPending) throw new Error("Intent should no longer be pending in Governance");
  console.log("✅ Intent successfully removed from Governance queue");

  // TEST 27-N: DOUBLE APPROVAL
  console.log("\n--- [27-N] DOUBLE APPROVAL TEST ---");
  const doubleApproveResult = await approveIntent(orgId, intentId, "Trying to approve again");
  console.log("Double Approve Result:", doubleApproveResult);
  if (doubleApproveResult.success || (doubleApproveResult as any).code !== 'ALREADY_PROCESSED') {
    throw new Error("Double approval protection failed");
  }
  console.log("✅ Double Approval correctly rejected");

  // TEST 27-G / 27-L: ACTIVITY AUDIT
  console.log("\n--- [27-L] ACTIVITY AUDIT E2E ---");
  const audit = await getMissionAuditTrail(orgId);
  console.log(`Audit Trail Events: ${audit.timeline.length}`);
  const approvalEvent = audit.timeline.find(e => e.title === 'OPERATIONAL_INTENT_APPROVED');
  if (!approvalEvent) throw new Error("Approval event not found in Audit Trail");
  console.log("✅ Approval event successfully recorded in Activity Timeline");

  // TEST 27-L: OUTBOX PROCESSING
  console.log("\n--- [27-L] OUTBOX PROCESSING ---");
  console.log("Running Outbox Processor...");
  const processor = new OutboxProcessor();
  await processor.processBatch();
  const outboxRecords = await db.select().from(outboxEvents).where(sql`aggregate_id = ${intentId}`).limit(1);
  const status = outboxRecords[0]?.status;
  console.log(`Outbox Event Status: ${status} (No handler is expected until Sprint 28)`);
  if (!status) throw new Error("Outbox event not found");
  console.log("✅ Outbox successfully captured the Governance Event");

  // TEST 27-M: CROSS-TENANT UI ATTACK
  console.log("\n--- [27-M] CROSS-TENANT UI ATTACK ---");
  const attackResult = await approveIntent('org_B', intentId, "Malicious approval");
  console.log("Cross-Tenant Attack Result:", attackResult);
  if (attackResult.success || (attackResult as any).code !== 'FORBIDDEN') {
    throw new Error("Cross-tenant tampering protection failed");
  }
  console.log("✅ Cross-Tenant UI Attack correctly blocked (FORBIDDEN)");

  console.log("\n✅ ALL SPRINT 27 UI INTEGRATION TESTS PASSED (GATE L, M, N)");
  process.exit(0);
}

main().catch(e => {
  console.error("❌ E2E TEST FAILED:", e);
  process.exit(1);
});
