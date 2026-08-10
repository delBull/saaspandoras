import { ControlPlaneContext } from '../src/lib/pandoras/core/domains/control-plane/application/context';
import { MemoryOperationalIntentRepository } from '../src/lib/pandoras/infrastructure/repositories/memory-operational-intent-repository';
import { MemoryGovernanceEventRepository } from '../src/lib/pandoras/infrastructure/repositories/memory-governance-event-repository';
import { ApprovalService } from '../src/lib/pandoras/core/domains/governance/approval-service';
import { ApproveIntentCommand } from '../src/lib/pandoras/core/domains/control-plane/application/commands/approve-intent';
import { RejectIntentCommand } from '../src/lib/pandoras/core/domains/control-plane/application/commands/reject-intent';

async function runBlueprint() {
  console.log("==================================================");
  console.log("🔒 22.6-D INTEGRITY LOCK BLUEPRINT");
  console.log("==================================================\n");

  // 1. Setup Infrastructure
  const intentRepo = new MemoryOperationalIntentRepository();
  const eventRepo = new MemoryGovernanceEventRepository(); // To be used when EventBus is fully wired to it. For now, we mock EventBus or rely on console.logs inside ApprovalService.
  
  // Seed Database
  await intentRepo.create({
    id: 'intent_A',
    missionId: 'mission_1',
    organizationId: 'org_A',
    status: 'pending_approval',
    intentType: 'marketing',
    createdAt: new Date(),
    updatedAt: new Date()
  } as any);

  await intentRepo.create({
    id: 'intent_B',
    missionId: 'mission_2',
    organizationId: 'org_B', // Different tenant!
    status: 'pending_approval',
    intentType: 'marketing',
    createdAt: new Date(),
    updatedAt: new Date()
  } as any);

  // 2. Setup Application & Domain
  const approvalService = new ApprovalService(intentRepo as any);
  const approveCommand = new ApproveIntentCommand(approvalService);
  const rejectCommand = new RejectIntentCommand(approvalService);

  // 3. Setup Authenticated Session (Org A)
  const contextA = new ControlPlaneContext(
    'session_123',
    'actor_A',
    'admin',
    ['approve_intent', 'reject_intent'],
    [{ organizationId: 'org_A', role: 'admin' }]
  );

  console.log("INITIAL STATE:");
  console.log("intent_A = PENDING_APPROVAL (belongs to org_A)");
  console.log("intent_B = PENDING_APPROVAL (belongs to org_B)");

  // -----------------------------------------------------------
  console.log("\n────────────────────────────");
  console.log("Test 1: Actor A / Org A -> approve(intent_A)");
  try {
    await approveCommand.execute(contextA, 'org_A', 'intent_A', 'Looks good');
    console.log("→ SUCCESS");
  } catch (e: any) {
    console.log("→ FAILED:", e.message);
  }

  // -----------------------------------------------------------
  console.log("\n────────────────────────────");
  console.log("Test 2: Actor A / Org A -> approve(intent_A) again (Idempotency check)");
  try {
    await approveCommand.execute(contextA, 'org_A', 'intent_A', 'Looks good again');
    console.log("→ SUCCESS");
  } catch (e: any) {
    console.log("→ EXPECTED FAILURE:", e.message);
  }

  // -----------------------------------------------------------
  console.log("\n────────────────────────────");
  console.log("Test 3: Actor A / Org A -> approve(intent_B) (Cross-Tenant Attack)");
  try {
    await approveCommand.execute(contextA, 'org_A', 'intent_B', 'Malicious approval');
    console.log("→ SUCCESS");
  } catch (e: any) {
    console.log("→ EXPECTED FAILURE:", e.message);
  }

  // -----------------------------------------------------------
  console.log("\n────────────────────────────");
  console.log("Test 4: Actor A / Org A -> reject(intent_A) (Invalid State Transition)");
  try {
    await rejectCommand.execute(contextA, 'org_A', 'intent_A', 'Changed my mind');
    console.log("→ SUCCESS");
  } catch (e: any) {
    console.log("→ EXPECTED FAILURE:", e.message);
  }

  // -----------------------------------------------------------
  console.log("\n────────────────────────────");
  console.log("Test 5: Actor A tries to impersonate Org B in URL");
  console.log("requestedOrganizationId = 'org_B'");
  try {
    // UI passes 'org_B' from params.id
    await approveCommand.execute(contextA, 'org_B', 'intent_B', 'Sneaky approval');
    console.log("→ SUCCESS");
  } catch (e: any) {
    console.log("→ EXPECTED FAILURE:", e.message);
  }

  console.log("\n==================================================");
  console.log("BLUEPRINT COMPLETE");
  console.log("==================================================");
}

runBlueprint().catch(console.error);
