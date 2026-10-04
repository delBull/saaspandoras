import { OperationalIntent } from './proactive-intent';
import { ProactiveContext } from './proactive-context-builder';
import { ProactiveCooldownStore } from './proactive-cooldown';

export type GovernanceDecision = 'APPROVED' | 'REJECTED' | 'REQUIRES_HUMAN_APPROVAL';

export class ProactiveGovernanceGate {
  /**
   * Evaluates if the OperationalIntent is authorized to be executed.
   */
  static async evaluate(
    intent: OperationalIntent,
    context: ProactiveContext
  ): Promise<{ decision: GovernanceDecision; reason?: string }> {
    
    // 1. Check Policy enablement
    if (!context.tenant.policy.enabled) {
      return { decision: 'REJECTED', reason: 'PROACTIVE_POLICY_DISABLED' };
    }

    // 2. Check Intent Type authorization
    if (!context.tenant.policy.allowedIntentTypes.includes(intent.type)) {
      return { decision: 'REJECTED', reason: 'INTENT_TYPE_NOT_ALLOWED' };
    }

    // 3. Check Channel authorization
    if (intent.channelConstraint !== 'any' && !context.tenant.policy.allowedChannels.includes(intent.channelConstraint as any)) {
      return { decision: 'REJECTED', reason: 'CHANNEL_NOT_AUTHORIZED_BY_TENANT' };
    }

    // 4. Evaluate Quiet Hours
    const isQuiet = await ProactiveCooldownStore.evaluateQuietHours(context.tenant.policy);
    if (isQuiet) {
      return { decision: 'REJECTED', reason: 'QUIET_HOURS_ACTIVE' };
    }

    // 5. Check Human Approval
    if (context.tenant.policy.requireApproval) {
      return { decision: 'REQUIRES_HUMAN_APPROVAL', reason: 'POLICY_REQUIRES_HUMAN_APPROVAL' };
    }

    return { decision: 'APPROVED' };
  }
}

export class ProactiveOutboundDispatcher {
  /**
   * Final dispatch routing. Checks contact bindings and routes the request.
   */
  static async dispatch(intent: OperationalIntent, context: ProactiveContext): Promise<{ success: boolean; channelSent?: string; error?: string }> {
    const contactChannels = context.contact.contactability.authorizedChannels;

    if (!contactChannels || contactChannels.length === 0) {
      return { success: false, error: 'NO_CONTACT_CHANNELS_AVAILABLE' };
    }

    let selectedChannel = intent.channelConstraint;
    if (selectedChannel === 'any') {
      // Prioritize telegram if available, else email
      selectedChannel = contactChannels.includes('telegram') ? 'telegram' : 'email';
    }

    if (!contactChannels.includes(selectedChannel)) {
      return { success: false, error: `REQUESTED_CHANNEL_UNAVAILABLE_${selectedChannel.toUpperCase()}` };
    }

    // Mock Dispatch
    console.log(`[OutboundDispatcher] Dispatched proactive intent via ${selectedChannel.toUpperCase()} to ${intent.audience}`);
    
    // In prod, this calls ExecutionOS/OutboundRouter which connects to Telegram Bot API or Resend API
    
    return { success: true, channelSent: selectedChannel };
  }
}

export class ProactiveCampaignPipeline {
  /**
   * End-to-end processing of a single Proactive Context through the governed pipeline.
   */
  static async run(context: ProactiveContext, intent: OperationalIntent) {
    const signal = context.contact.behavioralSignals[0];
    if (!signal) {
      return { status: 'NO_SIGNAL', reason: 'No behavioral signal provided in context.' };
    }
    
    // Check Idempotency/Cooldown
    const isCoolingDown = await ProactiveCooldownStore.isCooldownActive(
      context.tenant.organizationId,
      context.contact.actorId,
      signal.type
    );

    if (isCoolingDown) {
      return { status: 'COOLDOWN_SKIPPED' };
    }

    // 1. Governance Gate
    const govResult = await ProactiveGovernanceGate.evaluate(intent, context);
    if (govResult.decision !== 'APPROVED') {
      return { status: govResult.decision, reason: govResult.reason };
    }

    // 2. Dispatch
    const dispatchResult = await ProactiveOutboundDispatcher.dispatch(intent, context);
    if (!dispatchResult.success) {
      return { status: 'DISPATCH_FAILED', reason: dispatchResult.error };
    }

    // 3. Mark Cooldown
    await ProactiveCooldownStore.setCooldown(
      context.tenant.organizationId, 
      context.contact.actorId, 
      signal.type, 
      context.tenant.policy.cooldown.defaultHours
    );

    return { status: 'DISPATCHED', channel: dispatchResult.channelSent };
  }
}
