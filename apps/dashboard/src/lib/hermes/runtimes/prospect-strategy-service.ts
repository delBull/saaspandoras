import { ProspectContext, ProspectStrategy } from './prospect-intelligence-types';

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

    // 1. Academy Journey rules
    if (context.journey.academyStatus === 'CERTIFIED') {
      nextBestAction = 'BOOK_MEETING';
      commercialObjective = 'Schedule a technical or commercial onboarding call.';
      authorizedTopics.push('Onboarding', 'Enterprise Features');
    } else if (context.assessment && context.assessment.readinessScore < 50) {
      nextBestAction = 'SEND_CASE_STUDY';
      commercialObjective = 'Build foundational knowledge to overcome low readiness score.';
    }

    // 2. CRM Stage rules override
    if (context.journey.crmStage === 'QUALIFIED') {
      nextBestAction = 'BOOK_MEETING';
      commercialObjective = 'Close the prospect via meeting.';
    }

    // 3. Objections Handling
    const hasTrustObjection = context.objections.some(o => o.category === 'trust' && o.status === 'active');
    if (hasTrustObjection) {
      nextBestAction = 'NURTURE';
      commercialObjective = 'Build trust before proposing a meeting. Emphasize social proof and regulation.';
      authorizedTopics.push('Case Studies', 'Regulatory Compliance');
    }

    return {
      nextBestAction,
      authorizedTopics,
      restrictedTopics,
      commercialObjective
    };
  }

  /**
   * Generates a compact string representation of the intelligence to be injected 
   * into the LLM System Prompt.
   */
  static generateContextSummary(context: ProspectContext): string {
    const lines: string[] = [];
    
    lines.push(`--- PROSPECT INTELLIGENCE SUMMARY ---`);
    lines.push(`Identity: ${context.identity.canonicalId}`);
    lines.push(`CRM Stage: ${context.journey.crmStage} (${context.journey.daysInStage} days)`);
    
    if (context.journey.academyStatus) {
      lines.push(`Academy Status: ${context.journey.academyStatus}`);
    }
    if (context.assessment) {
      lines.push(`Readiness Score: ${context.assessment.readinessScore}/100`);
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
      lines.push(`Next Best Action (REQUIRED): ${context.strategy.nextBestAction}`);
      lines.push(`Authorized Topics: ${context.strategy.authorizedTopics.join(', ')}`);
      lines.push(`Restricted Topics: ${context.strategy.restrictedTopics.join(', ')}`);
    }

    return lines.join('\n');
  }
}
