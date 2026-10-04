import { StageCompletionPolicy, OnboardingActionProposal } from './types';
import { ONBOARDING_POLICIES } from './policies';

export class OnboardingTransitionValidator {
  /**
   * Valida si la propuesta del LLM cumple con la política de la etapa actual para poder transicionar.
   */
  static validate(proposal: OnboardingActionProposal): { 
    isReady: boolean; 
    reason?: string; 
  } {
    const policy = ONBOARDING_POLICIES[proposal.stage];
    
    if (!policy) {
      return { isReady: false, reason: `No policy defined for stage ${proposal.stage}` };
    }

    if (proposal.type !== 'STAGE_READY') {
      return { isReady: false, reason: 'LLM did not propose STAGE_READY' };
    }

    if (proposal.missingInformation && proposal.missingInformation.length > 0) {
      return { isReady: false, reason: `Missing required facts: ${proposal.missingInformation.join(', ')}` };
    }

    // In a more robust system, we would cross-check the DB to ensure Knowledge was actually created.
    return { isReady: true };
  }
}
