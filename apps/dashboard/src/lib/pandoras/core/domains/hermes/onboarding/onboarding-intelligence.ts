import { TenantOperationalState } from '../memory/types';
import { CapabilityEnvelope } from '../capabilities/types';
import { ControlPlaneContext } from '../knowledge/types';

export class OnboardingIntelligenceEngine {
  /**
   * Reconciles the conversational memory (what Hermes thinks) 
   * against the operational database state (what is actually true).
   * DB state ALWAYS outranks stale memory.
   */
  public static reconcileState(
    memoryState: Partial<TenantOperationalState>,
    dbState: TenantOperationalState
  ): TenantOperationalState {
    // 1. Missing Prerequisites
    const missing = dbState.missingPrerequisites || [];
    
    // 2. Setup completion
    const setup = dbState.setupCompletion;

    // 3. Products
    const productsEnabled = dbState.productsEnabled || [];

    // DB state prevails
    return {
      ...memoryState,
      tenantId: dbState.tenantId,
      productsEnabled,
      setupCompletion: setup,
      missingPrerequisites: missing,
      integrations: dbState.integrations,
      lastSync: new Date(),
    };
  }

  /**
   * Computes the onboarding objective with a strict hierarchy:
   * Explicit -> Persisted -> Validated State -> Inference -> UNKNOWN
   */
  public static computeObjective(
    explicitObjective?: string,
    persistedObjective?: string,
    state?: TenantOperationalState
  ): { value: string; source: 'USER_EXPLICIT' | 'PERSISTED' | 'DB_STATE' | 'LLM_INFERENCE' | 'UNKNOWN'; confidence: number } {
    
    if (explicitObjective) {
      return { value: explicitObjective, source: 'USER_EXPLICIT', confidence: 1.0 };
    }
    if (persistedObjective) {
      return { value: persistedObjective, source: 'PERSISTED', confidence: 1.0 };
    }
    if (state && state.setupCompletion === 100) {
      return { value: 'COMMERCIAL_LAUNCH', source: 'DB_STATE', confidence: 0.9 };
    }
    if (state && state.setupCompletion < 100) {
      return { value: 'COMPLETE_SETUP', source: 'DB_STATE', confidence: 0.8 };
    }
    
    return { value: 'UNKNOWN', source: 'UNKNOWN', confidence: 0 };
  }

  /**
   * Computes the Onboarding Journey State deterministically based on operational state.
   */
  public static computeJourney(state: TenantOperationalState): {
    currentState: string;
    requiredState: string;
    missingSteps: string[];
    nextBestStep: string;
  } {
    const missing = state.missingPrerequisites || [];
    const nextBest = (missing.length > 0 && missing[0]) ? missing[0] : 'ALL_SET';
    
    return {
      currentState: `${state.setupCompletion}% COMPLETED`,
      requiredState: '100% COMPLETED',
      missingSteps: missing,
      nextBestStep: nextBest,
    };
  }

  /**
   * Discovers authorized capabilities based solely on server-derived membership,
   * without assuming anything from user roles.
   */
  public static discoverCapabilities(
    tenantContext: ControlPlaneContext['tenantContext']
  ): CapabilityEnvelope | null {
    if (!tenantContext) return null;
    
    // In a real implementation, this would call CapabilityResolutionService
    // which queries the DB for granted capabilities and their states.
    // For this Surface, we derive strictly from the verified membership record.
    const isGestor = tenantContext.membership?.isGestor;
    const role = tenantContext.membership?.role || 'MEMBER';
    
    return {
      actorId: tenantContext.identityId || 'unknown',
      tenantId: tenantContext.organizationId || 'unknown',
      resolvedAt: new Date(),
      resolvedCapabilities: [
        { capabilityId: 'onboarding.view', state: 'AUTHORIZED', grantedBy: `membership:${role}` },
        { capabilityId: 'onboarding.guide', state: 'AUTHORIZED', grantedBy: `membership:${role}` },
        { capabilityId: 'onboarding.propose', state: 'AUTHORIZED', grantedBy: `membership:${role}` },
        { capabilityId: 'onboarding.execute', state: isGestor ? 'AUTHORIZED' : 'UNAVAILABLE', grantedBy: `membership:${role}` },
      ],
    };
  }
}
