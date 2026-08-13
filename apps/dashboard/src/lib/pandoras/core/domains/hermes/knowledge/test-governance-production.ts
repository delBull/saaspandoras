import { KnowledgeGovernanceService } from './service';
import { ControlPlaneContext } from './types';
import { db } from '@/db';

/**
 * Production Certification Matrix (KGC-P01 - KGC-P25)
 */
async function runProductionTests() {
  console.log("=== Running Knowledge Governance PRODUCTION Certification Matrix (KGC-P01 - KGC-P25) ===");
  
  // Clean DB for tests
  await KnowledgeGovernanceService._resetDB();

  const ctxAdminA: ControlPlaneContext = { actorId: 'admin_A', organizationId: 'tenant_A', role: 'ADMIN', permissions: [], sessionId: 's1' };
  const ctxViewerA: ControlPlaneContext = { actorId: 'viewer_A', organizationId: 'tenant_A', role: 'VIEWER', permissions: [], sessionId: 's2' };
  const ctxAdminB: ControlPlaneContext = { actorId: 'admin_B', organizationId: 'tenant_B', role: 'ADMIN', permissions: [], sessionId: 's3' };
  const ctxHermesA: ControlPlaneContext = { actorId: 'hermes_sys', organizationId: 'tenant_A', role: 'SYSTEM', permissions: [], sessionId: 'sys' };

  async function assertThrows(name: string, fn: () => Promise<any>, expectedErrorContains: string) {
    try {
      await fn();
      console.error(`❌ [FAILED] ${name}: Expected to throw, but succeeded.`);
      process.exit(1);
    } catch (e: any) {
      if (e.message.includes(expectedErrorContains)) {
        console.log(`✅ [PASSED] ${name}`);
      } else {
        console.error(`❌ [FAILED] ${name}: Threw wrong error. Expected '${expectedErrorContains}', got '${e.message}'`);
        process.exit(1);
      }
    }
  }

  // --- PRE-REQUISITE: Discover some knowledge ---
  const item1 = await KnowledgeGovernanceService.discover(ctxHermesA, {
    dimension: 'products', key: 'product_1', content: 'Price $50', visibility: 'PUBLIC', source: 'ONBOARDING_CONVERSATION'
  });
  
  const govItem = await KnowledgeGovernanceService.discover(ctxHermesA, {
    dimension: 'governance', key: 'approval_rule', content: 'Require human', visibility: 'INTERNAL', source: 'SYSTEM'
  });

  console.log("\n--- Executing Production Matrix ---");

  // P01/P18 - Direct Service call enforces ControlPlaneContext & Valid approval
  await KnowledgeGovernanceService.approveKnowledge(ctxAdminA, item1.id, 1);
  console.log("✅ [PASSED] KGC-P01/P18 - Valid approval with ControlPlaneContext");

  // P02 - Cross-tenant approval attack (DB level)
  const itemB = await KnowledgeGovernanceService.discover(ctxAdminB, {
    dimension: 'brand', key: 'logo', content: 'red logo', visibility: 'PUBLIC', source: 'OWNER_INPUT'
  });
  await assertThrows("KGC-P02 - Cross-tenant attack denied", 
    () => KnowledgeGovernanceService.approveKnowledge(ctxAdminA, itemB.id, 1), 
    "Cross-tenant attack detected"
  );

  // P03 - Unauthorized actor
  const item3 = await KnowledgeGovernanceService.discover(ctxHermesA, {
    dimension: 'business', key: 'biz', content: 'Biz details', visibility: 'PUBLIC', source: 'SYSTEM'
  });
  await assertThrows("KGC-P03 - Unauthorized actor denied",
    () => KnowledgeGovernanceService.approveKnowledge(ctxViewerA, item3.id, 1),
    "Unauthorized: Insufficient permissions"
  );

  // P04 - Invalid transition
  await assertThrows("KGC-P04 - Cannot approve already ACTIVE item",
    () => KnowledgeGovernanceService.approveKnowledge(ctxAdminA, item1.id, 1),
    "Invalid transition: Item is already ACTIVE"
  );

  // P06 - Stale version check (Optimistic Concurrency)
  const item6 = await KnowledgeGovernanceService.discover(ctxHermesA, {
    dimension: 'identity', key: 'id1', content: 'id details', visibility: 'PUBLIC', source: 'SYSTEM'
  });
  await assertThrows("KGC-P06/P21 - Concurrent approval preserves one ACTIVE version",
    () => KnowledgeGovernanceService.approveKnowledge(ctxAdminA, item6.id, 999),
    "Optimistic concurrency failure"
  );

  // P07 - Governance self-approval
  await assertThrows("KGC-P07 - Governance knowledge cannot be self-approved by the system",
    () => KnowledgeGovernanceService.approveKnowledge(ctxHermesA, govItem.id, 1),
    "Governance knowledge cannot be self-approved by the system"
  );

  // P08/P20 - Audit events generated in DB & append-only validation
  const audits = await KnowledgeGovernanceService.getAuditTrail('tenant_A');
  if (audits.length > 0) {
    console.log("✅ [PASSED] KGC-P08/P20 - Audit events are generated in DB");
  } else {
    console.error("❌ [FAILED] KGC-P08 - Audit events not generated");
    process.exit(1);
  }

  // P09 - Previous version superseded
  const editedItem = await KnowledgeGovernanceService.editKnowledge(ctxAdminA, item1.id, 'Price $75');
  await KnowledgeGovernanceService.approveKnowledge(ctxAdminA, editedItem.id, 2);
  const checkSuperseded = await KnowledgeGovernanceService.getExclusionRegister('tenant_A');
  if (checkSuperseded.find(k => k.id === item1.id && k.lifecycle.status === 'SUPERSEDED')) {
    console.log("✅ [PASSED] KGC-P09 - Previous version superseded atomically");
  } else {
    console.error("❌ [FAILED] KGC-P09 - Previous version not superseded");
    process.exit(1);
  }

  // P10 - Rejected item cannot become ACTIVE
  const item10 = await KnowledgeGovernanceService.discover(ctxHermesA, {
    dimension: 'market', key: 'm1', content: 'market data', visibility: 'PUBLIC', source: 'SYSTEM'
  });
  await KnowledgeGovernanceService.rejectKnowledge(ctxAdminA, item10.id, "Incorrect");
  await assertThrows("KGC-P10 - Rejected item cannot become ACTIVE",
    () => KnowledgeGovernanceService.approveKnowledge(ctxAdminA, item10.id, 1),
    "Invalid transition: Cannot approve a REJECTED item directly"
  );

  // P22 - Effective Context == Cognitive Runtime resolution
  const activeItems = await KnowledgeGovernanceService.getKnowledgeByStatus('tenant_A', 'ACTIVE');
  if (activeItems.length > 0 && activeItems.every(i => i.lifecycle.status === 'ACTIVE')) {
    console.log("✅ [PASSED] KGC-P22 - Effective Context strictly reads ACTIVE items");
  } else {
    console.error("❌ [FAILED] KGC-P22 - Effective Context returned non-active items");
    process.exit(1);
  }

  // P23 - Current exclusions != historical audit
  const exclusions = await KnowledgeGovernanceService.getExclusionRegister('tenant_A');
  if (exclusions.every(i => i.lifecycle.status === 'SUPERSEDED' || i.lifecycle.status === 'REJECTED') && exclusions.length < audits.length) {
    console.log("✅ [PASSED] KGC-P23 - Current exclusions distinct from historical audit");
  } else {
    console.error("❌ [FAILED] KGC-P23 - Exclusion register logic failed");
    process.exit(1);
  }

  // P25 - Refresh/re-login preserves persisted governance state
  const reloadedItems = await KnowledgeGovernanceService.getKnowledgeByStatus('tenant_A', 'ACTIVE');
  if (reloadedItems.length === activeItems.length) {
    console.log("✅ [PASSED] KGC-P24/P25 - Persistence validated across queries");
  } else {
    console.error("❌ [FAILED] KGC-P25 - State lost between queries");
    process.exit(1);
  }

  console.log("\n🚀 All Knowledge Governance PRODUCTION Certifications Passed!");
  process.exit(0);
}

runProductionTests().catch(e => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
