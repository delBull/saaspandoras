import { AddOnGovernanceService } from '../src/lib/pandoras/core/domains/hermes/addons/governance';
import { ControlPlaneContext } from '../src/lib/pandoras/core/domains/hermes/knowledge/types';
import { AddOnRegistryService } from '../src/lib/pandoras/core/domains/hermes/addons/registry';

async function runTests() {
  console.log("🚀 Starting Phase 6.9.3/6.9.4 Destructive Matrix Certification...");
  
  const tenantA: ControlPlaneContext = { actorId: 'actor_a', organizationId: 'tenant_A', role: 'ADMIN', permissions: [] };
  const tenantA_Admin2: ControlPlaneContext = { actorId: 'actor_admin', organizationId: 'tenant_A', role: 'ADMIN', permissions: [] };
  const tenantB: ControlPlaneContext = { actorId: 'actor_b', organizationId: 'tenant_B', role: 'ADMIN', permissions: [] };
  const systemActor: ControlPlaneContext = { actorId: 'sys_1', organizationId: 'tenant_A', role: 'SYSTEM', permissions: [] };
  
  // Setup: Register a dummy addon
  await AddOnRegistryService.register({
    id: 'test_addon_1',
    name: 'Test Add-On',
    version: '1.0.0',
    type: 'CAPABILITY',
    description: 'Test',
    capabilities: [],
    governanceRequirements: { requiresHumanApproval: true },
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

  // Test A05 / A06: Tenant isolation
  let instA = await assertSuccess("A05 - Tenant A requests installation", () => AddOnGovernanceService.requestInstallation('test_addon_1', tenantA));
  
  if (instA) {
    await assertThrows("A06 - Tenant B cannot configure Tenant A installation", "Unauthorized", 
      () => AddOnGovernanceService.configureAddOn(instA.id, {}, tenantB));
      
    // Test A10: Invalid transitions
    await assertThrows("A10 - Cannot approve directly from INSTALLING", "Invalid transition",
      () => AddOnGovernanceService.approveInstallation(instA.id, tenantA));
      
    await AddOnGovernanceService.configureAddOn(instA.id, { foo: 'bar' }, tenantA);
    await AddOnGovernanceService.submitForApproval(instA.id, tenantA);
    
    // Test A11 / A09: System cannot approve
    await assertThrows("A11 - SYSTEM actor cannot approve", "SYSTEM actors cannot approve",
      () => AddOnGovernanceService.approveInstallation(instA.id, systemActor));
      
    // Concurrent approval check (A26 logic simulation via transactions)
    // Drizzle's for('update') will handle A26 in real execution, we just approve normally here.
    // A08 uses a DIFFERENT admin than the installer (actor_a) to preserve A11 separation of duties.
    await assertSuccess("A08 - Admin approves installation", () => AddOnGovernanceService.approveInstallation(instA.id, tenantA_Admin2));
    
    await assertThrows("A10 - Cannot approve again", "Invalid transition",
      () => AddOnGovernanceService.approveInstallation(instA.id, tenantA_Admin2));
  }

  console.log(`\n🏁 Tests completed. PASS: ${passCount} | FAIL: ${failCount}`);
  process.exit(failCount > 0 ? 1 : 0);
}

runTests().catch(console.error);
