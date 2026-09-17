import { ProspectContext, ProspectIdentity } from './prospect-intelligence-types';

export interface IntelligenceScopeConfig {
  allowRestrictedFacts: boolean;
  allowCrossTenantFacts: boolean;
}

/**
 * Foundation for the Prospect Intelligence Engine.
 * 
 * In Phase 1, this service initializes the ProspectContext in a secure, scoped manner.
 * It enforces privacy boundaries, ensuring that sensitive data is not leaked into the LLM context.
 */
export class ProspectIntelligenceService {
  /**
   * Initializes the Prospect Context for a given canonical identity.
   * Enforces privacy scope to prevent sensitive data from leaking into the raw context.
   */
  static async buildInitialContext(
    identity: ProspectIdentity, 
    scope: IntelligenceScopeConfig = { allowRestrictedFacts: false, allowCrossTenantFacts: false }
  ): Promise<ProspectContext> {
    
    // In Phase 1, we just build the foundational structure.
    // In later phases, this will query DB for Journey, Assessments, Signals, etc.
    
    return {
      identity,
      journey: {
        crmStage: 'unknown',
        daysInStage: 0
      },
      signals: [],
      objections: [],
      facts: [],
      // assessment: undefined,
      // strategy: undefined,
    };
  }

  /**
   * Privacy Filter: Removes restricted facts before injecting into the Execution Manifest
   */
  static applyPrivacyFilter(context: ProspectContext, scope: IntelligenceScopeConfig): ProspectContext {
    if (scope.allowRestrictedFacts) {
      return context; // Admin or highly privileged internal actor
    }

    return {
      ...context,
      facts: context.facts.filter(f => f.sensitivity !== 'RESTRICTED'),
    };
  }
}
