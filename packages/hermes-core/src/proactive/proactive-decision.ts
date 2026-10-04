import { ProactiveContext } from './proactive-context-builder';
// Mocking the LLM generation for architectural purposes

export type ProactiveDecisionType = 'NO_ACTION' | 'PROACTIVE_FOLLOW_UP' | 'PROACTIVE_OFFER' | 'PROACTIVE_SUPPORT';

export interface StrategyDecision {
  decision: ProactiveDecisionType;
  objective: string;
  rationale: string;
  confidence: number;
  proposedChannel?: string;
  proposedMessage?: string;
}

export class ProactiveDecisionEngine {
  /**
   * Formulates a StrategyDecision based on the signal and contexts.
   * This calls the LLM Cognitive Runtime, strictly instructed to NOT send anything,
   * but rather DECIDE IF we should act.
   */
  static async formulate(context: ProactiveContext): Promise<StrategyDecision> {
    const signal = context.contact.behavioralSignals[0];
    if (!signal) {
      return {
        decision: 'NO_ACTION',
        objective: 'none',
        rationale: 'No signal detected.',
        confidence: 1.0
      };
    }

    // Mock LLM invocation
    // In production, this would use Ollama or OpenAI with a structured output schema
    // and a prompt like: "A behavioral signal has been detected. Determine whether an intervention is useful..."
    
    // Hardcoded logic for architectural test:
    if (signal.type === 'ABANDONED_ONBOARDING') {
      return {
        decision: 'PROACTIVE_FOLLOW_UP',
        objective: 'help_complete_onboarding',
        rationale: 'Tenant has not completed configuration in 48h. They might need help.',
        confidence: 0.9,
        proposedChannel: 'telegram'
      };
    }

    if (signal.type === 'HESITANT_BUYER') {
      return {
        decision: 'PROACTIVE_FOLLOW_UP',
        objective: 'assist_checkout_completion',
        rationale: 'Prospect might have encountered a payment issue.',
        confidence: 0.85,
        proposedChannel: 'whatsapp'
      };
    }

    return {
      decision: 'NO_ACTION',
      objective: 'none',
      rationale: 'Signal does not warrant proactive intervention at this time.',
      confidence: 0.99
    };
  }
}
