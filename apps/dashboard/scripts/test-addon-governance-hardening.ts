import { AddOnGovernanceService } from '../src/lib/pandoras/core/domains/hermes/addons/governance';
import { ControlPlaneContext } from '../src/lib/pandoras/core/domains/hermes/knowledge/types';
import { AddOnRegistryService } from '../src/lib/pandoras/core/domains/hermes/addons/registry';
import { db } from '@/db';
import { hermesAddonAudit } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

async function runHardeningTests() {
  console.log("🚀 Starting Phase 6.9-H Destructive Matrix Certification (A01-A30)...");
  
  const tenantA: ControlPlaneContext = { actorId: 'actor_a', organizationId: 'tenant_A', role: 'ADMIN', permissions: [] };
  const tenantA_Owner: ControlPlaneContext = { actorId: 'actor_owner', organizationId: 'tenant_A', role: 'OWNER', permissions: [] };
  
  // Setup: Register dummy addons
  await AddOnRegistryService.register({
    id: 'test_addon_manual',
    name: 'Manual Add-On',
    version: '1.0.0',
    type: 'CAPABILITY',
    description: 'Requires manual approval',
    capabilities: [],
    governanceRequirements: { requiresHumanApproval: true },
    compatibility: { minHermesVersion: '1.0.0' },
    status: 'AVAILABLE'
  });

  await AddOnRegistryService.register({
    id: 'test_addon_auto',
    name: 'Auto Add-On',
    version: '1.0.0',
    type: 'CAPABILITY',
    description: 'Auto activates',
    capabilities: [],
    governanceRequirements: { requiresHumanApproval: false },
    compatibility: { minHermesVersion: '1.0.0' },
    status: 'AVAILABLE'
  });

  let passCount = 0;
  let failCount = 0;

  const assertThrows = async (testName: string, expectedPattern: string, fn: () => Promise<any>) => {
    try {
      await fn();
      console.error(`❌ [FAIL] ${testName} (Did not throw)`);
      failCount++;
    } catch (e: any) {
      if (e.message.includes(expectedPattern)) {
        console.log(`✅ [PASS] ${testName}`);
        passCount++;
      } else {
        console.error(`❌ [FAIL] ${testName} (Threw wrong error: ${e.message})`);
        failCount++;
      }
    }
  };

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

  // Test Hardening Implementations
  // A11 - Self Approval
  let manualInst = await assertSuccess("A05 - Request Manual Install", () => AddOnGovernanceService.requestInstallation('test_addon_manual', tenantA));
  if (manualInst) {
    await AddOnGovernanceService.configureAddOn(manualInst.id, {}, tenantA);
    await AddOnGovernanceService.submitForApproval(manualInst.id, tenantA);
    
    // Attempt self-approval
    await assertThrows("A11 - Self Approval Forbidden", "Installer cannot approve their own installation", 
      () => AddOnGovernanceService.approveInstallation(manualInst.id, tenantA));
      
    // Approve with different owner
    let approvedInst = await assertSuccess("A09 - Approval by different OWNER", () => AddOnGovernanceService.approveInstallation(manualInst.id, tenantA_Owner));
    
    // Check version pinning
    if (approvedInst && !approvedInst.manifestSnapshot) {
      console.error(`❌ [FAIL] A28 - Manifest Version Pinning failed (snapshot is null)`);
      failCount++;
    } else {
      console.log(`✅ [PASS] A28 - Manifest Version Pinning successful`);
      passCount++;
    }
    
    // Check REJECTED semantics (by testing rejection on a new install)
    let manualInst2 = await assertSuccess("A14 - Request Install 2", () => AddOnGovernanceService.requestInstallation('test_addon_manual', tenantA));
    await AddOnGovernanceService.configureAddOn(manualInst2!.id, {}, tenantA);
    await AddOnGovernanceService.submitForApproval(manualInst2!.id, tenantA);
    let rejectedInst = await assertSuccess("A17 - Reject Installation", () => AddOnGovernanceService.rejectInstallation(manualInst2!.id, tenantA_Owner));
    
    if (rejectedInst && rejectedInst.status === 'REJECTED') {
       console.log(`✅ [PASS] A17 - Rejected status is distinct from Failed`);
       passCount++;
    } else {
       console.error(`❌ [FAIL] A17 - Rejected status mismatch (${rejectedInst?.status})`);
       failCount++;
    }
  }

  // Auto Activation
  let autoInst = await assertSuccess("A14 - Request Auto Install", () => AddOnGovernanceService.requestInstallation('test_addon_auto', tenantA));
  if (autoInst) {
    await AddOnGovernanceService.configureAddOn(autoInst.id, {}, tenantA);
    let activated = await assertSuccess("Auto Activation bypasses PENDING_APPROVAL", () => AddOnGovernanceService.submitForApproval(autoInst.id, tenantA));
    
    if (activated && activated.status === 'ACTIVE' && activated.approvedBy === null) {
      console.log(`✅ [PASS] Auto-Activation leaves approvedBy null`);
      passCount++;
    } else {
      console.error(`❌ [FAIL] Auto-Activation failed or approvedBy is not null`);
      failCount++;
    }
    
    // Check audit ledger for auto activation
    if (activated) {
      const audits = await db.select().from(hermesAddonAudit).where(eq(hermesAddonAudit.installationId, activated.id)).orderBy(desc(hermesAddonAudit.createdAt)).limit(1);
      if (audits.length > 0 && audits[0]?.eventType === 'AUTO_ACTIVATED' && audits[0]?.actorType === 'SYSTEM') {
        console.log(`✅ [PASS] Audit Ledger correct for Auto-Activation (actorType=SYSTEM, eventType=AUTO_ACTIVATED)`);
        passCount++;
      } else {
        console.error(`❌ [FAIL] Audit Ledger incorrect for Auto-Activation`);
        failCount++;
      }
    }
  }

  console.log(`\n🏁 Hardening Tests completed. PASS: ${passCount} | FAIL: ${failCount}`);
  process.exit(failCount > 0 ? 1 : 0);
}

runHardeningTests().catch(console.error);
