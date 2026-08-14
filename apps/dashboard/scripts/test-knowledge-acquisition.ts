import { HermesKnowledgeAcquisition } from '../src/lib/pandoras/core/domains/hermes/knowledge/acquisition';
import { KnowledgeGovernanceService } from '../src/lib/pandoras/core/domains/hermes/knowledge/service';
import { CognitiveContextBuilder } from '../src/lib/pandoras/core/domains/hermes/addons/context-merger';
import { ControlPlaneContext } from '../src/lib/pandoras/core/domains/hermes/knowledge/types';
import { db } from '../src/db';
import { hermesKnowledge } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

async function runTests() {
  console.log("🚀 Starting Phase 6.10.7 Knowledge Acquisition Certification...");

  const tenantId = `tenant_${Date.now()}`;
  const tenantContext: ControlPlaneContext = { 
    actorId: 'owner_1', 
    organizationId: tenantId, 
    role: 'OWNER', 
    permissions: [] 
  };

  let passCount = 0;
  let failCount = 0;

  const assertSuccess = async (testName: string, fn: () => Promise<any>) => {
    try {
      const res = await fn();
      console.log(`✅ [PASS] ${testName}`);
      passCount++;
      return res;
    } catch (e: any) {
      console.error(`❌ [FAIL] ${testName} (Unexpected throw: ${e.message})`);
      failCount++;
    }
  };

  const assertEquals = (testName: string, actual: any, expected: any) => {
    if (actual === expected) {
      console.log(`✅ [PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`❌ [FAIL] ${testName} (Expected ${expected}, got ${actual})`);
      failCount++;
    }
  };

  // Step 1: Simulate Onboarding Identity Input (should auto-approve)
  const identityCandidates = await assertSuccess("extractAndDiscover - Identity Configuration", () => 
    HermesKnowledgeAcquisition.extractAndDiscover(tenantContext, 'IDENTITY_CONFIGURATION', 'Pandoras Finance')
  );

  // Identity should auto-approve organization_name
  const identityItem = await db.query.hermesKnowledge.findFirst({
    where: and(eq(hermesKnowledge.organizationId, tenantId), eq(hermesKnowledge.dimension, 'identity'))
  });

  assertEquals("Identity candidate is ACTIVE (Auto-approve)", identityItem?.status, 'ACTIVE');

  // Step 2: Simulate Onboarding Business Discovery (should require review)
  const projectCandidates = await assertSuccess("extractAndDiscover - Business Discovery", () => 
    HermesKnowledgeAcquisition.extractAndDiscover(tenantContext, 'BUSINESS_DISCOVERY', 'Tenemos 8 departamentos')
  );

  const projectItem = await db.query.hermesKnowledge.findFirst({
    where: and(eq(hermesKnowledge.organizationId, tenantId), eq(hermesKnowledge.dimension, 'project'))
  });

  assertEquals("Project candidate is PENDING_REVIEW", projectItem?.status, 'PENDING_REVIEW');

  // Step 3: Check intelligence scores before approval
  let effectiveContext = await CognitiveContextBuilder.buildEffectiveContext(tenantId, 'contact_1');
  let projectScore = effectiveContext.intelligenceScores.find(s => s.dimension === 'project');
  
  assertEquals("Project score has 0 active claims", projectScore?.activeClaims, 0);
  assertEquals("Project score has 1 pending claim", projectScore?.pendingClaims, 1);

  // Step 4: Human Approve the project claim
  await assertSuccess("Human Approve Project Claim", () => 
    KnowledgeGovernanceService.approveKnowledge(tenantContext, projectItem!.id, 1)
  );

  // Step 5: Check intelligence scores after approval
  effectiveContext = await CognitiveContextBuilder.buildEffectiveContext(tenantId, 'contact_1');
  projectScore = effectiveContext.intelligenceScores.find(s => s.dimension === 'project');

  assertEquals("Project score has 1 active claim after approval", projectScore?.activeClaims, 1);
  assertEquals("Project score has 0 pending claims after approval", projectScore?.pendingClaims, 0);

  // Check if it's in the effective context knowledge array
  const isInKnowledgeArray = effectiveContext.knowledge.some(k => k.id === projectItem?.id);
  assertEquals("Project claim is in effective context knowledge array", isInKnowledgeArray, true);

  console.log(`\n🏁 Tests completed. PASS: ${passCount} | FAIL: ${failCount}`);
  process.exit(failCount > 0 ? 1 : 0);
}

runTests().catch(console.error);
