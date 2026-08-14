import { v4 as uuidv4 } from 'uuid';
import { 
  KnowledgeDimension, 
  KnowledgeCandidate, 
  ControlPlaneContext,
  KnowledgeStatus
} from './types';
import { KnowledgeDimensionDefinitionRegistry } from './registry';
import { KnowledgeGovernanceService } from './service';
import { OnboardingStage } from '../onboarding-workflow';

export class HermesKnowledgeAcquisition {
  /**
   * Deterministically maps onboarding stages to the expected dimensions to extract.
   */
  private static stageDimensionMap: Record<OnboardingStage, KnowledgeDimension[]> = {
    'BUSINESS_DISCOVERY': ['project', 'market'],
    'IDENTITY_CONFIGURATION': ['identity', 'founder'],
    'KNOWLEDGE_GATHERING': ['evidence', 'product'],
    'POLICY_DEFINITION': ['governance', 'offer'],
    'CHANNEL_SETUP': ['identity'],
    'ACTIVATION': []
  };

  /**
   * Extracts knowledge from user input and discovers it through governance.
   * This represents the "Acquisition -> Governance" boundary.
   */
  static async extractAndDiscover(
    context: ControlPlaneContext,
    stage: OnboardingStage,
    userInput: string,
    conversationId?: string,
    messageId?: string
  ): Promise<KnowledgeCandidate[]> {
    
    const dimensions = this.stageDimensionMap[stage] || [];
    const candidates: KnowledgeCandidate[] = [];

    // K10-ARCH rule: "Each stage with substantive input may produce candidates"
    if (!userInput || userInput.trim() === '') {
      return candidates;
    }

    for (const dimension of dimensions) {
      // In MVP, we do deterministic extraction. We'll pick a key based on stage or just use a generic key
      let claimKey = 'raw_input';
      if (dimension === 'identity') claimKey = 'organization_name';
      else if (dimension === 'project') claimKey = 'problem';

      const candidateId = `cand_${Date.now()}_${uuidv4().substring(0, 8)}`;
      
      const candidate: KnowledgeCandidate = {
        id: candidateId,
        organizationId: context.organizationId,
        dimension,
        claim: {
          key: claimKey,
          content: userInput,
          rawInput: userInput
        },
        provenance: {
          source: 'ONBOARDING_CONVERSATION',
          sourceReference: messageId || 'unknown',
          conversationId,
          messageId,
          confidence: 'HIGH', // MVP deterministic assumption
          extractedAt: new Date()
        },
        governance: {
          requiresHumanApproval: true,
          visibility: 'INTERNAL',
          authority: 'TENANT_PROVIDED'
        }
      };

      // 1. Evaluate Governance Policy (Acquisition proposes, Policy decides)
      const policyResult = KnowledgeDimensionDefinitionRegistry.evaluateAutoApprovalPolicy(
        dimension,
        claimKey,
        'ONBOARDING_CONVERSATION'
      );

      candidate.governance.requiresHumanApproval = policyResult.requiresHumanApproval;
      candidate.governance.autoApproveReason = policyResult.reason;

      // 2. Determine initial status for Governance Service
      const initialStatus: KnowledgeStatus = policyResult.requiresHumanApproval ? 'PENDING_REVIEW' : 'ACTIVE';

      // 3. Delegate to Knowledge Governance
      await KnowledgeGovernanceService.discover(context, {
        dimension: candidate.dimension,
        key: candidate.claim.key,
        content: candidate.claim.content,
        visibility: candidate.governance.visibility,
        source: candidate.provenance.source,
        sourceReference: candidate.provenance.sourceReference,
        status: initialStatus
      });

      candidates.push(candidate);
    }

    return candidates;
  }
}
