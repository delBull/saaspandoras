import { KnowledgeDimension, KnowledgeSource, KnowledgeCandidate } from './types';

export interface DimensionExpectedClaim {
  key: string;
  description: string;
}

export interface DimensionDefinition {
  id: KnowledgeDimension;
  title: string;
  description: string;
  expectedClaims: DimensionExpectedClaim[];
}

export class KnowledgeDimensionDefinitionRegistry {
  private static definitions: Record<KnowledgeDimension, DimensionDefinition> = {
    identity: {
      id: 'identity',
      title: 'Identity',
      description: 'Organization identity, brand, and communication tone.',
      expectedClaims: [
        { key: 'organization_name', description: 'The official name of the organization.' },
        { key: 'brand_name', description: 'The commercial or brand name.' },
        { key: 'basic_tone', description: 'The communication tone of the organization.' },
        { key: 'legal_status', description: 'Legal entity status or type.' }
      ]
    },
    project: {
      id: 'project',
      title: 'Project',
      description: 'Core details about the project, its problem, and solution.',
      expectedClaims: [
        { key: 'problem', description: 'The core problem the project solves.' },
        { key: 'solution', description: 'The proposed solution.' },
        { key: 'differentiator', description: 'Key market differentiators.' },
        { key: 'roadmap', description: 'Project timeline or roadmap.' }
      ]
    },
    product: {
      id: 'product',
      title: 'Product',
      description: 'The actual product offering, pricing, and mechanics.',
      expectedClaims: [
        { key: 'core_offer', description: 'The primary product or service offered.' },
        { key: 'pricing_model', description: 'How the product is priced.' }
      ]
    },
    market: {
      id: 'market',
      title: 'Market',
      description: 'Target audience, geography, and market size.',
      expectedClaims: [
        { key: 'target_audience', description: 'Who the product is built for.' },
        { key: 'geography', description: 'Target locations or markets.' }
      ]
    },
    founder: {
      id: 'founder',
      title: 'Founder',
      description: 'Information about the founders and team.',
      expectedClaims: [
        { key: 'founder_name', description: 'Name of the founder(s).' },
        { key: 'founder_background', description: 'Relevant background or credentials.' }
      ]
    },
    business_model: {
      id: 'business_model',
      title: 'Business Model',
      description: 'How the organization captures value.',
      expectedClaims: [
        { key: 'revenue_stream', description: 'Primary sources of revenue.' },
        { key: 'tokenomics', description: 'Token mechanics if applicable.' }
      ]
    },
    traction: {
      id: 'traction',
      title: 'Traction',
      description: 'Metrics, sales, and achieved milestones.',
      expectedClaims: [
        { key: 'current_status', description: 'Current development or operational status.' },
        { key: 'key_metric', description: 'Primary traction metric (e.g., users, TVL).' }
      ]
    },
    evidence: {
      id: 'evidence',
      title: 'Evidence',
      description: 'Documents, certificates, or verifiable proofs.',
      expectedClaims: [
        { key: 'incorporation', description: 'Proof of legal entity.' },
        { key: 'audit', description: 'Smart contract or financial audits.' }
      ]
    },
    offer: {
      id: 'offer',
      title: 'Offer',
      description: 'Specific promises or Calls to Action.',
      expectedClaims: [
        { key: 'primary_cta', description: 'Main action users should take.' },
        { key: 'value_promise', description: 'The specific value promised to users.' }
      ]
    },
    governance: {
      id: 'governance',
      title: 'Governance',
      description: 'Rules, compliance, and restrictions.',
      expectedClaims: [
        { key: 'restriction', description: 'Things the agent is restricted from doing.' },
        { key: 'compliance_rule', description: 'Regulatory or compliance requirements.' }
      ]
    }
  };

  static getDefinition(dimension: KnowledgeDimension): DimensionDefinition {
    return this.definitions[dimension];
  }

  static getAllDefinitions(): DimensionDefinition[] {
    return Object.values(this.definitions);
  }

  /**
   * Evaluates auto-approval policy for a given candidate based on K10-ARCH rules.
   * Auto-approval is granular: dimension + claimKey + provenance.
   */
  static evaluateAutoApprovalPolicy(
    dimension: KnowledgeDimension, 
    claimKey: string, 
    source: KnowledgeSource
  ): { requiresHumanApproval: boolean; reason?: string } {
    
    // Policy: Identity basics from owner/onboarding are safe
    if (dimension === 'identity') {
      const safeIdentityKeys = ['organization_name', 'brand_name', 'basic_tone'];
      if (safeIdentityKeys.includes(claimKey) && (source === 'ONBOARDING_CONVERSATION' || source === 'OWNER_INPUT')) {
        return { requiresHumanApproval: false, reason: 'Low-risk identity claim from authorized source.' };
      }
    }

    // Policy: Market & Founder are generally low-risk during onboarding
    if ((dimension === 'market' || dimension === 'founder') && source === 'ONBOARDING_CONVERSATION') {
      return { requiresHumanApproval: false, reason: `Low-risk ${dimension} claim from onboarding.` };
    }

    // Default policy: Human review required
    return { requiresHumanApproval: true };
  }
}
