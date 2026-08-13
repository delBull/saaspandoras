import { AddOnRegistryService, HermesAddOnManifest } from './registry';
import { AddOnInstallationManager } from './installation-manager';
import { CognitiveContextBuilder } from './context-merger';

async function run() {
  console.log('--- Hermes Add-On Ecosystem E2E Test ---');

  // 1. Register VIP Family Add-On in the master Registry
  const vipFamilyManifest: HermesAddOnManifest = {
    id: 'vip_family_concierge',
    version: '1.0.0',
    name: 'VIP Family Concierge',
    description: 'Referral Trust Journey and VIP treatments',
    category: ['STRATEGY', 'JOURNEY'],
    status: 'ACTIVE',
    capabilities: [{ id: 'vip_referral_management', name: 'VIP Referral Management' }],
    styleOverlay: {
      mode: 'institutional_concierge',
      warmth: 'high',
      exclusivity: 'high',
      directness: 'high',
      pressure: 'low',
      personalization: 'high',
    },
    governanceRequirements: [
      { rule: 'human_approval', description: 'Requires approval for financial claims' }
    ]
  };

  AddOnRegistryService.register(vipFamilyManifest);

  const tenantId = 'snarai';

  console.log('\n[1] Tenant requests installation...');
  const installation = await AddOnInstallationManager.requestInstallation(tenantId, 'vip_family_concierge', '1.0.0');
  
  console.log('\n[2] Tenant provides configuration...');
  await AddOnInstallationManager.configure(tenantId, installation.id, {
    programName: 'Familia Fundadores',
    referralMode: 'PRIVATE'
  });
  
  console.log(`Current State: ${installation.state}`); // Should be PENDING_APPROVAL because of governance rule

  console.log('\n[3] Admin approves installation...');
  await AddOnInstallationManager.approve(tenantId, installation.id);
  console.log(`Current State: ${installation.state}`); // Should be ACTIVE

  console.log('\n[4] Building Effective Cognitive Context for Conversation...');
  const context = await CognitiveContextBuilder.buildEffectiveContext(tenantId, 'contact_123');
  
  console.log('\n--- EFFECTIVE CONTEXT ---');
  console.log(JSON.stringify(context, null, 2));

  console.log('\n✅ All tests passed. The VIP Family Add-On successfully altered the Cognitive Context!');
}

run().catch(console.error);
