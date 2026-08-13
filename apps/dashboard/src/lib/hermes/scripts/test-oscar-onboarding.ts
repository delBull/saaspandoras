import { db } from '@/db';
import { projects, installedProducts, portalOnboardingState } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { TenantKnowledgeStore, ControlPlaneContext } from '../knowledge/tenant-knowledge-store';
import { KnowledgePackLoader } from '../knowledge-pack';
import * as assert from 'assert';
import { ensureInitialWorkspace } from '../../platform/workspace-bootstrap';

async function testOscarOnboarding() {
  console.log("Starting Destructive Test: Tenant #002 (Óscar)...\n");

  const oscarEmail = 'oscar@test.com';

  // 1. Clean up previous test
  try {
    const existing = await db.query.projects.findFirst({
      where: eq(projects.slug, 'workspace-oscar-test-com')
    });
    if (existing) {
      await db.delete(portalOnboardingState).where(eq(portalOnboardingState.tenantId, existing.id.toString()));
      await db.delete(installedProducts).where(eq(installedProducts.projectId, existing.id));
      await db.delete(projects).where(eq(projects.id, existing.id));
      console.log("🧹 Cleaned up old Óscar workspace.");
    }
  } catch (e) {
    console.log("No cleanup needed.");
  }

  // 2. Trigger auto-provisioning
  const workspaceInfo = await ensureInitialWorkspace(oscarEmail);
  console.log("✅ Provisioned Óscar workspace:", workspaceInfo.projectSlug);

  const context: ControlPlaneContext = {
    organizationId: workspaceInfo.projectSlug,
    actorId: 'oscar-user-id',
    sessionId: 'session-123',
    permissions: ['platform:knowledge:write']
  };

  // 3. Simulate Hermes discovering Identity
  const identityUpdate = await TenantKnowledgeStore.updateKnowledge(
    context, 
    'identity', 
    'Óscar Corp is a leading AI consultancy firm based in Madrid.'
  );
  assert.strictEqual(identityUpdate.success, true);
  console.log("✅ Hermes mutated 'identity' via tool. Event:", identityUpdate.event?.id);

  // 4. Simulate Hermes discovering Governance (should be marked UNKNOWN, not DISCOVERED)
  const govUpdate = await TenantKnowledgeStore.updateKnowledge(
    context,
    'governance',
    'Any deal above 10K requires CTO approval.'
  );
  assert.strictEqual(govUpdate.event?.status, 'UNKNOWN');
  console.log("✅ Governance knowledge strictly isolated (Status: UNKNOWN).");

  // 5. Check Zero S'Narai Fallback
  const oscarPack = await KnowledgePackLoader.getPack(workspaceInfo.projectSlug);
  const jsonStr = JSON.stringify(oscarPack).toLowerCase();
  assert.strictEqual(jsonStr.includes('snarai'), false);
  console.log("✅ Zero S'Narai Fallback verified. Pack isolated.");

  console.log("\n🚀 Tenant #002 Onboarding Destructive Test Passed Successfully!");
}

testOscarOnboarding().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
