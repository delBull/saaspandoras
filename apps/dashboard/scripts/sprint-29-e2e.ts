import { db } from '~/db';
import { executionRecords, missionEvents, campaigns } from '~/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { executionOS } from '~/lib/pandoras/composition/execution-composition';
import { CapabilityContext } from '~/lib/pandoras/core/domains/execution/contracts/capability-contracts';
import { DispatchRequest } from '~/lib/pandoras/core/domains/execution/contracts/execution-contracts';

async function runE2E() {
  console.log("🚀 Starting Sprint 29 E2E Verification Blueprint");
  console.log("=================================================");

  const orgId = "pandoras"; // Default test org
  const missionId = `mission_test_${Date.now()}`;
  const intentId = `intent_test_${Date.now()}`;
  const capabilityId = 'CREATE_REFERRAL_CAMPAIGN';
  const version = 'v1';
  const idempotencyKey = `idemp_${Date.now()}`;

  const baseContext: CapabilityContext = {
    organizationId: orgId,
    actorId: 'system_test',
    missionId: missionId,
    intentId: intentId,
    correlationId: 'corr_123',
    idempotencyKey: idempotencyKey
  };

  try {
    // TEST 01 & 03: Capability execution & Registration
    console.log("\n[TEST 01 & 03] Executing CREATE_REFERRAL_CAMPAIGN...");
    
    const request1: DispatchRequest = {
      capabilityId,
      version,
      input: { test: true },
      context: baseContext
    };

    const result1 = await executionOS.execute(request1);
    
    if (result1.status === 'succeeded') {
      console.log("✅ TEST 03 PASSED: Capability executed successfully.");
      console.log(`   -> Output Campaign ID: ${result1.data?.campaignId}`);
    } else {
      console.error("❌ TEST 03 FAILED:", result1);
    }

    // TEST 02: Valid State Transitions (Check DB for SUCCEEDED)
    const record1 = await db.query.executionRecords.findFirst({
      where: and(
        eq(executionRecords.organizationId, orgId),
        eq(executionRecords.idempotencyKey, idempotencyKey)
      )
    });

    if (record1 && record1.state === 'SUCCEEDED') {
      console.log("✅ TEST 02 PASSED: Execution state is SUCCEEDED.");
    } else {
      console.error("❌ TEST 02 FAILED: State is not SUCCEEDED or record missing.", record1);
    }

    // TEST 05: Duplicate delivery (Idempotency)
    console.log("\n[TEST 05] Testing idempotency with duplicate delivery...");
    const result2 = await executionOS.execute(request1);
    
    if (result2.status === 'succeeded' && result2.data?.message?.includes('idempotent')) {
      console.log("✅ TEST 05 PASSED: Idempotency correctly handled duplicate delivery.");
    } else {
      console.error("❌ TEST 05 FAILED: Did not receive idempotent success.", result2);
    }

    // Check that there is only one campaign created for this intent
    const campaignCount = await db.select().from(campaigns).where(
      eq(campaigns.name, `Referral Campaign (Intent: ${intentId})`)
    );
    if (campaignCount.length === 1) {
      console.log("✅ TEST 05.1 PASSED: Only 1 campaign exists in DB.");
    } else {
      console.error(`❌ TEST 05.1 FAILED: Found ${campaignCount.length} campaigns.`);
    }

    // TEST 04: Capability Failure
    console.log("\n[TEST 04] Testing Capability failure (Missing orgId)...");
    const badContext = { ...baseContext, organizationId: '', idempotencyKey: `idemp_bad_${Date.now()}` };
    const requestBad: DispatchRequest = {
      capabilityId,
      version,
      input: {},
      context: badContext
    };

    const resultBad = await executionOS.execute(requestBad);
    if (resultBad.status === 'failed') {
      console.log(`✅ TEST 04 PASSED: Capability failed correctly. Reason: ${resultBad.error?.category}`);
    } else {
      console.error("❌ TEST 04 FAILED: Capability should have failed but succeeded.");
    }

    // TEST 06: Mission feedback observation
    console.log("\n[TEST 06] Verifying Mission Feedback...");
    const events = await db.query.missionEvents.findMany({
      where: eq(missionEvents.missionId, missionId),
      orderBy: [desc(missionEvents.createdAt)]
    });

    // Should have 1 SUCCESS and 1 FAILED
    const successEvent = events.find(e => e.eventType === 'CAPABILITY_EXECUTED');
    const failedEvent = events.find(e => e.eventType === 'CAPABILITY_FAILED');

    if (successEvent && failedEvent) {
      console.log("✅ TEST 06 PASSED: Found both success and failure mission feedback events.");
    } else {
      console.error("❌ TEST 06 FAILED: Missing mission feedback events.", events);
    }

    console.log("\n🎉 All Sprint 29 checks completed.");

  } catch (err) {
    console.error("💥 Blueprint script failed catastrophically:", err);
  } finally {
    process.exit(0);
  }
}

runE2E();
