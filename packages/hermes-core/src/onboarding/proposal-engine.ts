export interface StrategyProposal {
  proposalId: string;
  action: string;
  reason: string;
  confidence: number;
  prerequisites: {
    met: string[];
    missing: string[];
  };
  authority: 'PROPOSE_ONLY' | 'EXECUTE' | 'ESCALATE';
}

export interface ValidatedProposal {
  proposalId: string;
  action: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'BLOCKED';
  blockReason?: string;
  authority: 'PROPOSE_ONLY';
}

export class ProposalEngine {
  /**
   * Processes an LLM-generated StrategyProposal.
   * Ensures the proposal is structurally valid, checks allowlists, 
   * capability checks, policy checks, and prerequisite checks.
   */
  public static processProposal(
    llmProposal: StrategyProposal,
    surfaceAllowedActions: string[]
  ): ValidatedProposal {
    // 1. Schema Validation (mocked here, ideally Zod)
    if (!llmProposal.action || !llmProposal.proposalId) {
      return {
        proposalId: llmProposal.proposalId || `prop_${Date.now()}`,
        action: llmProposal.action || 'UNKNOWN',
        status: 'BLOCKED',
        blockReason: 'MALFORMED_PROPOSAL',
        authority: 'PROPOSE_ONLY',
      };
    }

    // 2. Action Allowlist (Surface Capabilities Envelope)
    if (!surfaceAllowedActions.includes(llmProposal.action)) {
      return {
        proposalId: llmProposal.proposalId,
        action: llmProposal.action,
        status: 'BLOCKED',
        blockReason: 'ACTION_NOT_ALLOWED_IN_SURFACE',
        authority: 'PROPOSE_ONLY',
      };
    }

    // 3. Prerequisite Check
    if (llmProposal.prerequisites?.missing?.length > 0) {
      return {
        proposalId: llmProposal.proposalId,
        action: llmProposal.action,
        status: 'BLOCKED',
        blockReason: 'MISSING_PREREQUISITES',
        authority: 'PROPOSE_ONLY',
      };
    }

    // 4. Policy Check
    if (llmProposal.authority !== 'PROPOSE_ONLY') {
       return {
        proposalId: llmProposal.proposalId,
        action: llmProposal.action,
        status: 'BLOCKED',
        blockReason: 'POLICY_VIOLATION_EXECUTION_ATTEMPT',
        authority: 'PROPOSE_ONLY',
      };
    }

    // Validated successfully
    return {
      proposalId: llmProposal.proposalId,
      action: llmProposal.action,
      status: 'PROPOSED',
      authority: 'PROPOSE_ONLY',
    };
  }
}
