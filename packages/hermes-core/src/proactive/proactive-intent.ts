import { StrategyDecision } from './proactive-decision';
import { ProactiveContext } from './proactive-context-builder';

export type OperationalIntentType = 'CONTACT_PROSPECT' | 'CONTACT_TENANT_ADMIN' | 'UPDATE_CRM' | 'ESCALATE_TO_HUMAN';

export interface OperationalIntent {
  type: OperationalIntentType;
  objective: string;
  audience: string;
  channelConstraint: string;
  messageIntent?: {
    suggestedMessage?: string;
  };
}

export class ProactiveIntentFactory {
  /**
   * Converts a StrategyDecision into a strict OperationalIntent.
   * This maintains the boundary between Strategy and Execution (ADR-009).
   */
  static build(decision: StrategyDecision, context: ProactiveContext): OperationalIntent | null {
    if (decision.decision === 'NO_ACTION') {
      return null;
    }

    let type: OperationalIntentType = 'CONTACT_PROSPECT';
    
    // If we're helping the tenant admin with onboarding
    if (context.contact.behavioralSignals[0]?.type === 'ABANDONED_ONBOARDING') {
      type = 'CONTACT_TENANT_ADMIN';
    }

    return {
      type,
      objective: decision.objective,
      audience: context.contact.actorId,
      channelConstraint: decision.proposedChannel || 'any',
      messageIntent: {
        suggestedMessage: decision.proposedMessage
      }
    };
  }
}
