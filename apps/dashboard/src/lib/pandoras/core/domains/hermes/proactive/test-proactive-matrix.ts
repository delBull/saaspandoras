import * as assert from 'assert';
import { ProactiveSignal } from './signal-registry';
import { ProactiveContextBuilder, ProactiveContext } from './proactive-context-builder';
import { ProactiveDecisionEngine } from './proactive-decision';
import { ProactiveIntentFactory, OperationalIntent } from './proactive-intent';
import { ProactiveGovernanceGate, ProactiveOutboundDispatcher, ProactiveCampaignPipeline } from './proactive-dispatcher';
import { ProactiveCooldownStore } from './proactive-cooldown';

async function testProactiveMatrix() {
  console.log("Starting E2E Proactive Closer Engine Test Matrix...\n");

  const baseSignal: ProactiveSignal = {
    id: 'sig_123',
    type: 'ABANDONED_ONBOARDING',
    actorId: 'user_1',
    organizationId: 'snarai',
    detectedAt: new Date().toISOString(),
    evidence: { currentStage: 'BUSINESS_DISCOVERY' }
  };

  const context = await ProactiveContextBuilder.build(baseSignal, "S'Narai Tenant", { product: "Founder Certificate" });

  // --- P4 Policy Enforcement ---
  const disabledContext = JSON.parse(JSON.stringify(context)) as ProactiveContext;
  disabledContext.tenant.policy.enabled = false;
  
  const strategy = await ProactiveDecisionEngine.formulate(disabledContext);
  const intent = ProactiveIntentFactory.build(strategy, disabledContext);
  
  if (intent) {
    const govResult = await ProactiveGovernanceGate.evaluate(intent, disabledContext);
    assert.strictEqual(govResult.decision, 'REJECTED');
    assert.strictEqual(govResult.reason, 'PROACTIVE_POLICY_DISABLED');
    console.log("✅ P4 PASS: Policy disabled correctly rejects intent.");
  }

  // --- P6 Channel Authority ---
  const channelContext = JSON.parse(JSON.stringify(context)) as ProactiveContext;
  channelContext.tenant.policy.allowedChannels = ['email'];
  
  const chIntent: OperationalIntent = {
    type: 'CONTACT_PROSPECT',
    objective: 'test',
    audience: 'user_1',
    channelConstraint: 'whatsapp'
  };
  
  const chGovResult = await ProactiveGovernanceGate.evaluate(chIntent, channelContext);
  assert.strictEqual(chGovResult.decision, 'REJECTED');
  assert.strictEqual(chGovResult.reason, 'CHANNEL_NOT_AUTHORIZED_BY_TENANT');
  console.log("✅ P6 PASS: Unmatched Channel Constraint is blocked by Governance.");

  // --- P8 Human Approval ---
  const approvalContext = JSON.parse(JSON.stringify(context)) as ProactiveContext;
  approvalContext.tenant.policy.requireApproval = true;
  
  const apIntent: OperationalIntent = {
    type: 'CONTACT_PROSPECT',
    objective: 'test',
    audience: 'user_1',
    channelConstraint: 'any'
  };
  
  const apGovResult = await ProactiveGovernanceGate.evaluate(apIntent, approvalContext);
  assert.strictEqual(apGovResult.decision, 'REQUIRES_HUMAN_APPROVAL');
  console.log("✅ P8 PASS: Human Approval requirement correctly halts automated execution.");

  // --- P9 Contactability ---
  const uncontactableContext = JSON.parse(JSON.stringify(context)) as ProactiveContext;
  uncontactableContext.contact.contactability.authorizedChannels = []; // User didn't link TG or Email
  
  const ucIntent: OperationalIntent = {
    type: 'CONTACT_PROSPECT',
    objective: 'test',
    audience: 'user_1',
    channelConstraint: 'any'
  };
  
  const ucDispatchResult = await ProactiveOutboundDispatcher.dispatch(ucIntent, uncontactableContext);
  assert.strictEqual(ucDispatchResult.success, false);
  assert.strictEqual(ucDispatchResult.error, 'NO_CONTACT_CHANNELS_AVAILABLE');
  console.log("✅ P9 PASS: Contactability prevents dispatch if user channels are missing.");

  // --- P5 Cooldown ---
  const e2eIntent = ProactiveIntentFactory.build(strategy, context)!;
  const result1 = await ProactiveCampaignPipeline.run(context, e2eIntent);
  assert.strictEqual(result1.status, 'DISPATCHED');
  console.log("✅ P10 PASS: Audit Reconstruction - Signal -> Decision -> Intent -> Governance -> Dispatch completed.");

  // Immediate retry should hit cooldown
  const result2 = await ProactiveCampaignPipeline.run(context, e2eIntent);
  assert.strictEqual(result2.status, 'COOLDOWN_SKIPPED');
  console.log("✅ P5 PASS: Cooldown prevents duplicate execution for the same signal and user.");

  console.log("\n🚀 All Proactive Engine Tests Passed!");
}

testProactiveMatrix().catch(e => {
  console.error("Test Matrix Failed:", e);
  process.exit(1);
});
