import { ProspectContext, ProspectStrategy, KnowledgeStrategy } from './prospect-intelligence-types';

/**
 * P4: Strategy & Next Best Action
 * Evaluates the full ProspectContext to define deterministic sales/educational actions.
 * This removes decision-making from the LLM, leaving the LLM to just conversationalize 
 * the predetermined Strategy.
 */
export class ProspectStrategyService {
  /**
   * Deterministically evaluates the Next Best Action and strategy constraints.
   */
  static defineStrategy(context: ProspectContext): ProspectStrategy {
    let nextBestAction: ProspectStrategy['nextBestAction'] = 'NURTURE';
    const authorizedTopics: string[] = ['Academy Programs', 'Tokenization Basics'];
    const restrictedTopics: string[] = ['Discounts', 'Internal Metrics'];
    let commercialObjective = 'Educate and assess fit.';
    
    const knowledgeStrategy: KnowledgeStrategy = {
      retrieveTopics: [],
      avoidTopics: ['Advanced Tokenomics', 'Generic Introductory Content']
    };

    // 1. Academic vs Commercial Split
    const isAcademicLow = context.academicReadiness && context.academicReadiness.score < 50;
    const isCommercialHigh = context.commercialReadiness && ['QUALIFIED', 'SALES_READY'].includes(context.commercialReadiness.stage);

    if (isAcademicLow && !isCommercialHigh) {
      nextBestAction = 'SEND_CASE_STUDY';
      commercialObjective = 'Build foundational knowledge to overcome academic gap.';
      knowledgeStrategy.retrieveTopics.push('Basics', 'Introduction');
    } else if (isCommercialHigh) {
      nextBestAction = 'BOOK_MEETING';
      commercialObjective = 'Schedule a commercial onboarding call due to high intent.';
      authorizedTopics.push('Onboarding', 'Enterprise Features');
      knowledgeStrategy.retrieveTopics.push('Implementation', 'Enterprise');
    }

    // 2. Objections Handling
    const hasTrustObjection = context.objections.some(o => o.category === 'trust' && o.status === 'active');
    if (hasTrustObjection) {
      nextBestAction = 'NURTURE';
      commercialObjective = 'Build trust before proposing a meeting. Emphasize social proof and regulation.';
      authorizedTopics.push('Case Studies', 'Regulatory Compliance');
      knowledgeStrategy.retrieveTopics.push('Regulatory Framework', 'Case Study');
    }

    return {
      nextBestAction,
      actionAuthority: 'PROPOSE_ONLY',
      authorizedTopics,
      restrictedTopics,
      commercialObjective,
      knowledgeStrategy
    };
  }

  /**
   * Generates a compact string representation of the intelligence to be injected 
   * into the LLM System Prompt.
   */
  static generateContextSummary(context: ProspectContext): string {
    const lines: string[] = [];
    
    lines.push(`--- SERVER-SIDE SCOPED INTELLIGENCE ---`);
    lines.push(`Canonical Identity: ${context.identity.canonicalId}`);
    lines.push(`CRM Stage: ${context.journey.crmStage} (${context.journey.daysInStage} days)`);
    
    if (context.journey.academyStatus) {
      lines.push(`Academy Status: ${context.journey.academyStatus}`);
    }
    if (context.academicReadiness) {
      lines.push(`Academic Readiness: ${context.academicReadiness.score}/100`);
    }
    if (context.commercialReadiness) {
      lines.push(`Commercial Readiness: ${context.commercialReadiness.stage} (Score: ${context.commercialReadiness.score})`);
    }

    if (context.signals.length > 0) {
      lines.push(`Signals: ${context.signals.map(s => `[${s.level.toUpperCase()} ${s.type}]`).join(' ')}`);
    }
    
    if (context.objections.length > 0) {
      lines.push(`Active Objections: ${context.objections.map(o => o.category).join(', ')}`);
    }

    if (context.strategy) {
      lines.push(`\n--- STRATEGIC DIRECTIVES ---`);
      lines.push(`Objective: ${context.strategy.commercialObjective}`);
      lines.push(`Recommended Next Best Action: ${context.strategy.nextBestAction}`);
      lines.push(`Action Authority: ${context.strategy.actionAuthority}`);
      lines.push(`Authorized Topics: ${context.strategy.authorizedTopics.join(', ')}`);
      lines.push(`Restricted Topics: ${context.strategy.restrictedTopics.join(', ')}`);
    }

    return lines.join('\n');
  }
}
