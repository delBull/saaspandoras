import { db } from '~/db';
import { sql } from 'drizzle-orm';
import { missions, outboxEvents } from '~/db/schema';
import { getOrganizationOverview, getActiveMissions, getPendingIntents, getMissionAuditTrail, approveIntent } from '~/app/growth-os/organizations/[id]/actions';
import { OutboxProcessor } from '~/lib/outbox/processor';
// Importamos la composición del Execution OS para que los handlers se registren en el registry global
import '~/lib/pandoras/composition/execution-composition';

async function main() {
  console.log("🚀 SPRINT 28 EXECUTION BRIDGE END-TO-END & IDEMPOTENCY TEST");

  const orgId = "org_snarai_sprint22";
  const intentId = `intent_exec_test_${Date.now()}`;
  const missionId = `mission_exec_test_${Date.now()}`;

  // 1. Setup Test Data
  const goalId = `goal_exec_test_${Date.now()}`;
  
  await db.execute(sql`
    INSERT INTO missions (id, organization_id, goal_id, pack_id, pack_version, current_phase, state, created_at, updated_at) 
    VALUES (${missionId}, ${orgId}, ${goalId}, 'referral-trust', '1.0.0', 'setup', '{}', NOW(), NOW())
  `);

  await db.execute(sql`
    INSERT INTO operational_intents (
      id, organization_id, mission_id, strategy_decision_id, pack_id, pack_version, objective, rationale, intent_type,
      constraints, approval_policy, status, created_at, updated_at
    ) VALUES (
      ${intentId}, ${orgId}, ${missionId}, 'strategy_test_' || EXTRACT(EPOCH FROM NOW())::TEXT, 'referral-trust', '1.0.0', 'Test Strategy Decision', 'Testing the Execution Bridge',
      'CREATE_REFERRAL_CAMPAIGN', '[]', '{"required": true}', 'pending_approval', NOW(), NOW()
    )
  `);
  console.log("✅ Seeded Mission and Pending Intent");

  // 2. Approve Intent (Control Plane)
  await approveIntent(orgId, intentId, "Approved via Sprint 28 Script");
  console.log("✅ Intent Approved. Outbox Event should be pending.");

  // 3. Process Outbox First Time
  console.log("\n--- [28-N] OUTBOX PROCESSING (1st Run) ---");
  const processor = new OutboxProcessor();
  await processor.processBatch();

  const outboxRecords1 = await db.select().from(outboxEvents).where(sql`aggregate_id = ${intentId}`).limit(1);
  if (outboxRecords1[0]?.status !== 'processed') {
    throw new Error(`Outbox event was not processed successfully. Status: ${outboxRecords1[0]?.status}`);
  }
  console.log("✅ Outbox processor successfully executed the handler.");

  // 4. Verify Database Effect (Campaign Created)
  console.log("\n--- [28-P] DATABASE EFFECT VERIFICATION ---");
  const campaignName = `Referral Campaign (Intent: ${intentId})`;
  const campaignsResult: any = await db.execute(sql`SELECT * FROM campaigns WHERE name = ${campaignName}`);
  const campaignsCount = campaignsResult.rows ? campaignsResult.rows.length : campaignsResult.length;
  if (campaignsCount !== 1) {
    throw new Error(`Expected exactly 1 campaign, found ${campaignsCount}`);
  }
  console.log("✅ Capability generated exactly 1 campaign record.");

  // 5. Verify Feedback Loop (Mission Event emitted)
  console.log("\n--- [28-Q] FEEDBACK EVENT VERIFICATION ---");
  const missionEventsResult: any = await db.execute(sql`SELECT * FROM mission_events WHERE mission_id = ${missionId} AND event_type = 'CAPABILITY_EXECUTED'`);
  const missionEventsCount = missionEventsResult.rows ? missionEventsResult.rows.length : missionEventsResult.length;
  if (missionEventsCount !== 1) {
    throw new Error(`Expected exactly 1 mission event, found ${missionEventsCount}`);
  }
  console.log("✅ MissionEvent emitted successfully by Feedback Loop.");

  // 6. Verify Idempotency (Process Same Request Again)
  console.log("\n--- [28-F] IDEMPOTENCY TEST ---");
  
  // Re-insert same outbox event manually to simulate at-least-once delivery duplication
  await db.execute(sql`
    INSERT INTO outbox_events (organization_id, aggregate_type, aggregate_id, event_type, payload, status)
    VALUES (${orgId}, 'operational_intent', ${intentId}, 'OPERATIONAL_INTENT_APPROVED', ${JSON.stringify(outboxRecords1[0].payload)}::jsonb, 'pending')
  `);

  console.log("Duplicated outbox event inserted. Running processor again...");
  await processor.processBatch();

  // Verify campaign count is still 1
  const campaignsResult2: any = await db.execute(sql`SELECT * FROM campaigns WHERE name = ${campaignName}`);
  const campaignsCount2 = campaignsResult2.rows ? campaignsResult2.rows.length : campaignsResult2.length;
  if (campaignsCount2 !== 1) {
    throw new Error(`Idempotency failed: expected exactly 1 campaign, found ${campaignsCount2}`);
  }
  console.log("✅ Idempotency confirmed: No duplicate campaign created.");
  
  // Verify that the second event also emitted a MissionEvent since we ran the capability again 
  // (Wait, actually if it's idempotent it might just return success and emit the event again, or not, 
  // but let's just check the campaign wasn't duplicated).

  console.log("\n✅ ALL SPRINT 28 EXECUTION TESTS PASSED!");
  process.exit(0);
}

main().catch(err => {
  console.error("\n❌ E2E TEST FAILED:");
  console.error(err);
  process.exit(1);
});
