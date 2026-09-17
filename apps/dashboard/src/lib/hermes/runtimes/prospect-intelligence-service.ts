import { ProspectContext, ProspectIdentity, ProspectJourneyState, IntelligenceFact, ProspectSignal, ProspectObjection } from './prospect-intelligence-types';
import { db } from '@/db';
import { marketingLeads } from '@/db/schema';
import { academyCandidates, academyAssessments } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export interface IntelligenceScopeConfig {
  allowRestrictedFacts: boolean;
  allowCrossTenantFacts: boolean;
}

/**
 * Foundation for the Prospect Intelligence Engine.
 * 
 * In Phase 2 & 3, this service enriches the ProspectContext securely, pulling from CRM and Academy.
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
    
    // --- P2: Journey Intelligence ---
    let crmStage = 'LEAD';
    let daysInStage = 0;
    let academyStatus: string | undefined;
    let assessmentSummary = undefined;
    const facts: IntelligenceFact[] = [];
    const signals: ProspectSignal[] = [];
    const objections: ProspectObjection[] = [];

    // 1. CRM Lead Resolution
    const [lead] = await db
      .select()
      .from(marketingLeads)
      .where(eq(marketingLeads.identityId, identity.marketingIdentityId))
      .orderBy(desc(marketingLeads.updatedAt))
      .limit(1);

    if (lead) {
      crmStage = lead.crmStage || 'LEAD';
      const lastUpdate = lead.updatedAt ? new Date(lead.updatedAt).getTime() : Date.now();
      daysInStage = Math.floor((Date.now() - lastUpdate) / (1000 * 60 * 60 * 24));
      
      // P3: Behavioral Signals from CRM
      if (lead.score > 70) {
        signals.push({ type: 'engagement', level: 'high', context: 'Lead has high CRM score' });
      }
      if (lead.intent === 'invest') {
        signals.push({ type: 'intent', level: 'high', context: 'Explicit purchase intent in CRM' });
      }
      
      facts.push({
        id: `fact_crm_${lead.id}`,
        category: 'journey',
        value: `Lead is in stage ${crmStage} for ${daysInStage} days.`,
        source: 'CRM',
        observedAt: new Date(),
        confidence: 1.0,
        classification: 'FACT',
        sensitivity: 'NORMAL',
      });
    }

    // 2. Academy Resolution (using email)
    const searchEmail = identity.email || lead?.email;
    if (searchEmail) {
      const [candidate] = await db
        .select()
        .from(academyCandidates)
        .where(eq(academyCandidates.email, searchEmail))
        .limit(1);

      if (candidate) {
        academyStatus = candidate.attendanceStatus;
        
        // Load Assessments
        const [assessment] = await db
          .select()
          .from(academyAssessments)
          .where(eq(academyAssessments.candidateId, candidate.id))
          .orderBy(desc(academyAssessments.startedAt))
          .limit(1);

        if (assessment) {
          assessmentSummary = {
            programId: assessment.programId,
            readinessScore: assessment.overallReadinessScore || 0,
            primaryGaps: [], // MVP: Would be derived from answers
            recommendedModules: [], 
            lastEvaluatedAt: assessment.startedAt
          };

          // Objections heuristic
          if (assessment.overallReadinessScore && assessment.overallReadinessScore < 50) {
            objections.push({
              category: 'trust',
              description: 'Low readiness score implies lack of foundational trust or knowledge.',
              status: 'active'
            });
          }
        }
      }
    }

    const journey: ProspectJourneyState = {
      crmStage,
      academyStatus,
      daysInStage
    };

    return {
      identity,
      journey,
      assessment: assessmentSummary,
      signals,
      objections,
      facts,
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
