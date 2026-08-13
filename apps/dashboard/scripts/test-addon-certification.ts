import 'dotenv/config';
import { AddOnGovernanceService } from '../src/lib/pandoras/core/domains/hermes/addons/governance';
import { CognitiveContextBuilder } from '../src/lib/pandoras/core/domains/hermes/addons/context-merger';
import type { ControlPlaneContext } from '../src/lib/pandoras/core/domains/hermes/knowledge/types';
import { db } from '../src/db';
import { projects, hermesAddonInstallations, hermesAddonAudit } from '../src/db/schema';
import { eq } from 'drizzle-orm';

let PASS = 0;
let FAIL = 0;

function check(ruleName: string, passed: boolean, detail?: string) {
  if (passed) {
    PASS++;
    console.log(`  ✅ ${ruleName}`);
  } else {
    FAIL++;
    console.log(`  ❌ ${ruleName}${detail ? ' — ' + detail : ''}`);
  }
}

async function runTests() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  PHASE 6.9.7 — ADD-ON CERTIFICATION (Destruction Matrix)  ');
  console.log('════════════════════════════════════════════════════════════\n');

  // ── Setup: ephemeral test tenant rows ────────────────────────────────────
  console.log('[Setup] Provisioning ephemeral test tenants...');
  const ts = Date.now();

  const [rowA] = await db.insert(projects)
    .values({ title: 'Cert Tenant A', slug: `cert-a-${ts}`, description: 'cert', status: 'draft' })
    .returning({ id: projects.id });

  const [rowB] = await db.insert(projects)
    .values({ title: 'Cert Tenant B', slug: `cert-b-${ts}`, description: 'cert', status: 'draft' })
    .returning({ id: projects.id });

  const tenantAId = String(rowA!.id);
  const tenantBId = String(rowB!.id);
  console.log(`  Tenant A: ${tenantAId} | Tenant B: ${tenantBId}\n`);

  // Build contexts (plain objects — matches the ControlPlaneContext interface)
  const ctxInstaller: ControlPlaneContext = {
    actorId: 'actor_installer',
    organizationId: tenantAId,
    role: 'OWNER',
    permissions: ['addons.install', 'addons.configure', 'addons.submit'],
    sessionId: 'session-installer',
  };
  const ctxApprover: ControlPlaneContext = {
    actorId: 'actor_approver',
    organizationId: tenantAId,
    role: 'ADMIN',
    permissions: ['addons.approve'],
    sessionId: 'session-approver',
  };
  const ctxTenantB: ControlPlaneContext = {
    actorId: 'actor_b',
    organizationId: tenantBId,
    role: 'OWNER',
    permissions: ['addons.approve'],
    sessionId: 'session-b',
  };
  const ctxSystem: ControlPlaneContext = {
    actorId: 'SYSTEM',
    organizationId: tenantAId,
    role: 'SYSTEM',
    permissions: ['*'],
    sessionId: 'session-system',
  };

  let mainInstallationId = '';

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1: Happy Path — Full E2E Lifecycle
    // ─────────────────────────────────────────────────────────────────────────
    console.log('── TEST 1: Happy Path (DISCOVER → ACTIVE) ───────────────');

    const inst = await AddOnGovernanceService.requestInstallation('core.customer_support', ctxInstaller);
    mainInstallationId = inst.id;
    check('A01: Installation created (status=INSTALLING)', inst.status === 'INSTALLING');
    check('A17: installedBy recorded', inst.installedBy === ctxInstaller.actorId);

    await AddOnGovernanceService.configureAddOn(mainInstallationId, { autoReply: true }, ctxInstaller);
    const [afterCfg] = await db.select().from(hermesAddonInstallations).where(eq(hermesAddonInstallations.id, mainInstallationId));
    check('A10: INSTALLING → CONFIGURING transition allowed', afterCfg?.status === 'CONFIGURING');

    await AddOnGovernanceService.submitForApproval(mainInstallationId, ctxInstaller);
    const [submitted] = await db.select().from(hermesAddonInstallations).where(eq(hermesAddonInstallations.id, mainInstallationId));
    check('A08: Status → PENDING_APPROVAL after submit', submitted?.status === 'PENDING_APPROVAL');

    await AddOnGovernanceService.approveInstallation(mainInstallationId, ctxApprover);
    const [approved] = await db.select().from(hermesAddonInstallations).where(eq(hermesAddonInstallations.id, mainInstallationId));
    check('A09: Status → ACTIVE after approval', approved?.status === 'ACTIVE');
    check('A09: approvedBy set on record', !!approved?.approvedBy);
    check('A09: activatedAt set on record', !!approved?.activatedAt);

    // Verify audit trail
    const auditRows = await db.select().from(hermesAddonAudit).where(eq(hermesAddonAudit.installationId, mainInstallationId));
    check('A18: Audit trail has ≥3 append-only events', auditRows.length >= 3);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: Runtime Effectiveness (ContextMerger)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── TEST 2: Runtime Effectiveness (ContextMerger v2) ─────');

    const ctx = await CognitiveContextBuilder.buildEffectiveContext(tenantAId, 'contact-test');
    check('A21: Active Add-On injects capabilities or knowledge', ctx.activeCapabilities.length > 0 || ctx.knowledge.length > 0);
    check('A20: Core security context is populated', !!ctx.core?.tenantId);

    // A PENDING installation must NOT appear in runtime
    const pendingInst = await AddOnGovernanceService.requestInstallation('core.sales_agent', ctxInstaller);
    const ctxAfterPending = await CognitiveContextBuilder.buildEffectiveContext(tenantAId, 'contact-test');
    check('A22: PENDING add-on does NOT bleed into runtime', ctxAfterPending.activeCapabilities.length === ctx.activeCapabilities.length);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3: Self-Approval Prohibition (A11)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── TEST 3: Self-Approval Prohibition (A11) ──────────────');

    // Use the pending inst from above — submit it
    await AddOnGovernanceService.submitForApproval(pendingInst.id, ctxInstaller);

    try {
      await AddOnGovernanceService.approveInstallation(pendingInst.id, ctxInstaller);
      check('A11: Self-approval blocked', false, 'Did not throw');
    } catch (e: any) {
      check('A11: Self-approval blocked (installedBy === actorId)', e.message.includes('A11'));
    }

    // SYSTEM actor also cannot approve
    try {
      await AddOnGovernanceService.approveInstallation(pendingInst.id, ctxSystem);
      check('A11: SYSTEM actor cannot approve', false, 'Did not throw');
    } catch (e: any) {
      check('A11: SYSTEM actor approval blocked', e.message.includes('A11') || e.message.includes('SYSTEM'));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4: Tenant Isolation (A05/A06/A07)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── TEST 4: Tenant Isolation (A05/A06/A07) ───────────────');

    try {
      await AddOnGovernanceService.approveInstallation(mainInstallationId, ctxTenantB);
      check('A07: Cross-tenant approval blocked', false, 'Did not throw');
    } catch (e: any) {
      check('A07: Cross-tenant approval blocked', e.message.toLowerCase().includes('unauthorized') || e.message.includes('A05') || e.message.includes('A06') || e.message.includes('A07'));
    }

    try {
      await AddOnGovernanceService.configureAddOn(mainInstallationId, { malicious: true }, ctxTenantB);
      check('A05: Cross-tenant configure blocked', false, 'Did not throw');
    } catch (e: any) {
      check('A05: Cross-tenant configure blocked', true);
    }

    try {
      await AddOnGovernanceService.suspendAddOn(mainInstallationId, ctxTenantB);
      check('A06: Cross-tenant suspend blocked', false, 'Did not throw');
    } catch (e: any) {
      check('A06: Cross-tenant suspend blocked', true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 5: Invalid State Transitions (A10)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── TEST 5: Invalid Transitions (A10) ────────────────────');

    // Cannot configure an ACTIVE installation
    try {
      await AddOnGovernanceService.configureAddOn(mainInstallationId, { hack: true }, ctxApprover);
      check('A10: Cannot configure ACTIVE installation', false, 'Did not throw');
    } catch (e: any) {
      check('A10: Cannot configure ACTIVE installation', e.message.includes('A10') || e.message.toLowerCase().includes('invalid transition'));
    }

    // Cannot approve a REJECTED installation
    const rejInst = await AddOnGovernanceService.requestInstallation('core.customer_support', ctxInstaller);
    await AddOnGovernanceService.submitForApproval(rejInst.id, ctxInstaller);
    await AddOnGovernanceService.rejectInstallation(rejInst.id, ctxApprover);
    try {
      await AddOnGovernanceService.approveInstallation(rejInst.id, ctxApprover);
      check('A10: Cannot approve REJECTED installation', false, 'Did not throw');
    } catch (e: any) {
      check('A10: Cannot approve REJECTED installation', e.message.includes('A10') || e.message.toLowerCase().includes('pending_approval') || e.message.toLowerCase().includes('invalid transition'));
    }

    // Cannot suspend a PENDING installation
    const pendInst2 = await AddOnGovernanceService.requestInstallation('core.sales_agent', ctxInstaller);
    await AddOnGovernanceService.submitForApproval(pendInst2.id, ctxInstaller);
    try {
      await AddOnGovernanceService.suspendAddOn(pendInst2.id, ctxApprover);
      check('A10: Cannot suspend PENDING installation', false, 'Did not throw');
    } catch (e: any) {
      check('A10: Cannot suspend PENDING installation', e.message.includes('A10') || e.message.toLowerCase().includes('cannot suspend'));
    }

  } catch (err: any) {
    console.error('\n[FATAL] Unexpected error during certification:', err.message, err.stack);
    FAIL++;
  } finally {
    // ─ Cleanup ───────────────────────────────────────────────────────────────
    console.log('\n[Cleanup] Removing ephemeral test data...');
    await db.delete(hermesAddonAudit).where(eq(hermesAddonAudit.organizationId, tenantAId));
    await db.delete(hermesAddonInstallations).where(eq(hermesAddonInstallations.organizationId, tenantAId));
    await db.delete(projects).where(eq(projects.id, rowA!.id));
    await db.delete(projects).where(eq(projects.id, rowB!.id));

    // ─ Summary ───────────────────────────────────────────────────────────────
    console.log('\n════════════════════════════════════════════════════════════');
    console.log(`  RESULTS: ${PASS} passed  |  ${FAIL} failed`);
    if (FAIL === 0) {
      console.log('  🏆 CERTIFICATION PASSED — Phase 6.9.7 Complete');
    } else {
      console.log('  ⚠️  CERTIFICATION INCOMPLETE — Review failures above');
    }
    console.log('════════════════════════════════════════════════════════════');
    process.exit(FAIL > 0 ? 1 : 0);
  }
}

runTests();
