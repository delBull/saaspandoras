import 'dotenv/config';
import { db } from '@/db';
import { projects, hermesAddons, hermesAddonInstallations, hermesAddonAudit } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CognitiveContextBuilder } from '@/lib/pandoras/core/domains/hermes/addons/context-merger';
import { AddOnGovernanceService } from '@/lib/pandoras/core/domains/hermes/addons/governance';
import { ControlPlaneContext } from '@/lib/pandoras/core/domains/hermes/knowledge/types';

async function runTests() {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  PHASE 6.9.5 — RUNTIME INTEGRATION PROBE TEST  ');
  console.log('════════════════════════════════════════════════════════════\n');

  console.log('[Setup] Provisioning ephemeral test tenant and Add-On...');
  const ts = Date.now();
  
  // 1. Create Tenant
  const [tenant] = await db.insert(projects)
    .values({ title: 'VIP Tenant', slug: `vip-tenant-${ts}`, description: 'cert', status: 'draft' })
    .returning({ id: projects.id, slug: projects.slug });
    
  const tenantId = tenant.slug; // Using slug as organizationId per schema references

  // 2. Create VIP Add-On
  const addonId = `vip_family_${ts}`;
  await db.insert(hermesAddons).values({
    id: addonId,
    name: 'VIP Family Concierge',
    version: '1.0.0',
    type: 'CAPABILITY',
    description: 'Provides high-exclusivity concierge capabilities',
    manifest: {
      id: addonId,
      name: 'VIP Family Concierge',
      version: '1.0.0',
      type: 'CAPABILITY',
      description: 'Provides high-exclusivity concierge capabilities',
      capabilities: [
        {
          id: 'vip_referral_management',
          category: 'UTILITY',
          description: 'Manage VIP referrals',
          suggestedActions: [
            'Invite family member',
            'Review referral',
            'Connect with founder'
          ]
        }
      ],
      styleOverlay: {
        mode: 'institutional_concierge',
        exclusivity: 'high'
      },
      governanceRequirements: { requiresHumanApproval: true },
      compatibility: { minPlatform: '1.0.0' },
      status: 'AVAILABLE'
    } as any,
    status: 'AVAILABLE'
  });

  const governanceCtx: ControlPlaneContext = {
    sessionId: 'sess_1',
    actorId: 'admin_1',
    role: 'OWNER',
    organizationId: tenantId,
    permissions: ['*']
  };

  const sysCtx: ControlPlaneContext = {
    sessionId: 'sys',
    actorId: 'SYSTEM',
    role: 'SYSTEM',
    organizationId: tenantId,
    permissions: ['*']
  };

  try {
    // ── STEP 1: INSTALL ADD-ON ──
    console.log(`\n── STEP 1: Install & Approve Add-On ───────────────`);
    const installRes = await AddOnGovernanceService.requestInstallation(addonId, governanceCtx);
    const installationId = installRes.id;
    
    // Configure
    await AddOnGovernanceService.configureAddOn(installationId, { api_key: 'test' }, governanceCtx);
    // Submit
    await AddOnGovernanceService.submitForApproval(installationId, governanceCtx);
    
    // Approve (needs distinct actor)
    const approverCtx: ControlPlaneContext = { ...governanceCtx, actorId: 'approver_2' };
    await AddOnGovernanceService.approveInstallation(installationId, approverCtx);
    
    console.log('  ✅ Add-On is now ACTIVE');

    // ── STEP 2: VERIFY RUNTIME PROBE (ACTIVE) ──
    console.log(`\n── STEP 2: ContextMerger Probe (ACTIVE) ───────────────`);
    let ctx = await CognitiveContextBuilder.buildEffectiveContext(tenantId, 'portal_user');
    
    const hasCapability = ctx.activeCapabilities.some(c => c.id === 'vip_referral_management');
    const hasStyle = ctx.style.mode === 'institutional_concierge';
    const chips = ctx.activeCapabilities.flatMap(c => c.suggestedActions || []);
    const hasChips = chips.includes('Invite family member');
    
    if (hasCapability && hasStyle && hasChips) {
      console.log('  ✅ VIP capability appears in Context');
      console.log('  ✅ Style overlay applied (mode = institutional_concierge)');
      console.log('  ✅ VIP chips generated correctly');
    } else {
      throw new Error(`Context integration failed: cap=${hasCapability} style=${hasStyle} chips=${hasChips}`);
    }

    // ── STEP 3: SUSPEND ADD-ON ──
    console.log(`\n── STEP 3: Suspend Add-On ───────────────`);
    await AddOnGovernanceService.suspendAddOn(installationId, approverCtx);
    console.log('  ✅ Add-On is now SUSPENDED');

    // ── STEP 4: VERIFY RUNTIME PROBE (SUSPENDED) ──
    console.log(`\n── STEP 4: ContextMerger Probe (SUSPENDED) ───────────────`);
    ctx = await CognitiveContextBuilder.buildEffectiveContext(tenantId, 'portal_user');
    
    const hasCapabilitySuspended = ctx.activeCapabilities.some(c => c.id === 'vip_referral_management');
    const hasExcluded = ctx.diagnostics?.excludedAddOns.some(a => a.id === addonId);
    
    if (!hasCapabilitySuspended && hasExcluded) {
      console.log('  ✅ VIP capability disappeared from Context');
      console.log('  ✅ Add-On correctly marked as EXCLUDED in diagnostics');
    } else {
      throw new Error(`Suspension failed: capStillActive=${hasCapabilitySuspended}`);
    }

    console.log('\n[Success] All tests passed! 🎉');

  } catch (error) {
    console.error('\n[FATAL] Unexpected error during probe test:', error);
  } finally {
    // Cleanup
    console.log('\n[Cleanup] Removing ephemeral test data...');
    await db.delete(hermesAddonAudit).where(eq(hermesAddonAudit.organizationId, tenantId));
    await db.delete(hermesAddonInstallations).where(eq(hermesAddonInstallations.organizationId, tenantId));
    await db.delete(projects).where(eq(projects.slug, tenantId));
    await db.delete(hermesAddons).where(eq(hermesAddons.id, addonId));
    
    process.exit(0);
  }
}

runTests();
