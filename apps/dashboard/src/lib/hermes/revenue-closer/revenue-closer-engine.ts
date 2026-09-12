/**
 * Hermes Revenue Closer — Cognitive Engine Core
 * src/lib/hermes/revenue-closer/revenue-closer-engine.ts
 *
 * Implements the domain-agnostic 8-step cognitive conversion loop:
 * Identify -> Attribute -> Qualify -> Understand -> Respond -> Follow-up -> Commit -> Handoff
 *
 * Strictly adheres to Phase 0 frozen contracts in src/lib/hermes/contracts/.
 */

import {
  QualificationStage,
  QualificationContext,
  QualificationEvaluation,
  BudgetTier,
  DecisionRole
} from '../contracts/qualification';

import {
  AttributionPolicy,
  AttributionContext,
  AttributionRecord,
  AttributionChannel
} from '../contracts/attribution';

import {
  RevenueOpportunity,
  OpportunityStage,
  NextBestAction
} from '../contracts/opportunity';

import {
  ExecutiveHandoffSummary,
  HandoffUrgency
} from '../contracts/handoff';

export interface EvaluateQualificationInput {
  leadId: string;
  messageText: string;
  currentContext?: QualificationContext;
  signals?: {
    budgetTier?: BudgetTier;
    estimatedBudgetUsd?: number;
    purchaseHorizonDays?: number;
    decisionRole?: DecisionRole;
    needs?: string[];
    objections?: string[];
    intentToBook?: boolean;
    disqualified?: boolean;
  };
}

export interface ResolveAttributionInput {
  leadId: string;
  incomingReferralCode?: string;
  incomingMedium: AttributionChannel;
  policy: AttributionPolicy;
  existingContext?: AttributionContext;
  campaignSource?: string;
  touchTimestamp?: string;
}

export class RevenueCloserEngine {
  /**
   * Default initial qualification context for a fresh lead.
   */
  static createInitialQualificationContext(): QualificationContext {
    return {
      stage: 'ANONYMOUS',
      confidenceScore: 0.1,
      identifiedNeeds: [],
      keyObjectionsDetected: [],
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Step 3: Qualification Engine.
   * Evaluates qualification stage transitions, calculates scoring, and returns an immutable evaluation.
   */
  static evaluateQualification(input: EvaluateQualificationInput): QualificationEvaluation {
    const { leadId, messageText, signals } = input;
    const current = input.currentContext || this.createInitialQualificationContext();
    const previousStage = current.stage;

    // Disqualification check
    if (signals?.disqualified) {
      const disqualContext: QualificationContext = {
        ...current,
        stage: 'DISQUALIFIED',
        confidenceScore: 1.0,
        evaluatedAt: new Date().toISOString()
      };
      return {
        leadId,
        previousStage,
        newStage: 'DISQUALIFIED',
        scoreDelta: -100,
        totalScore: 0,
        confidence: 1.0,
        context: disqualContext,
        shouldEscalate: false,
        reason: 'Explicit disqualification criteria met'
      };
    }

    // Merge signals into updated context
    const budgetTier = signals?.budgetTier ?? current.budgetTier;
    const estimatedBudgetUsd = signals?.estimatedBudgetUsd ?? current.estimatedBudgetUsd;
    const purchaseHorizonDays = signals?.purchaseHorizonDays ?? current.purchaseHorizonDays;
    const decisionRole = signals?.decisionRole ?? current.decisionRole;

    const identifiedNeeds = Array.from(
      new Set([...current.identifiedNeeds, ...(signals?.needs || [])])
    );
    const keyObjectionsDetected = Array.from(
      new Set([...current.keyObjectionsDetected, ...(signals?.objections || [])])
    );

    // Calculate stage transitions
    let newStage: QualificationStage = previousStage;
    let reason = 'Context updated without stage change';

    if (previousStage === 'ANONYMOUS') {
      newStage = 'EXPLORING';
      reason = 'First contact established';
    }

    // Move to ENGAGED when needs or budget are identified
    if (
      (newStage === 'EXPLORING' || newStage === 'ANONYMOUS') &&
      (identifiedNeeds.length > 0 || budgetTier || estimatedBudgetUsd)
    ) {
      newStage = 'ENGAGED';
      reason = 'Prospect revealed specific needs or budget criteria';
    }

    // Move to HIGH_INTENT when budget is confirmed and purchase horizon is defined
    const hasHighBudget = Boolean(
      budgetTier === 'TIER_PREMIUM' ||
      budgetTier === 'TIER_INSTITUTIONAL' ||
      (typeof estimatedBudgetUsd === 'number' && estimatedBudgetUsd >= 50000)
    );
    const hasShortHorizon = typeof purchaseHorizonDays === 'number' && purchaseHorizonDays <= 90;

    if (newStage === 'ENGAGED' && (hasHighBudget || hasShortHorizon)) {
      newStage = 'HIGH_INTENT';
      reason = 'High ticket or near-term purchase horizon confirmed';
    }

    // Move to READY_TO_BOOK when explicit intent to meet or book is detected
    const bookingKeywords = ['cita', 'agenda', 'llamada', 'reunión', 'zoom', 'meet', 'videollamada', 'visita', 'platicar', 'asesor'];
    const messageMentionsBooking = bookingKeywords.some((kw) => messageText.toLowerCase().includes(kw));

    if (
      (newStage === 'ENGAGED' || newStage === 'HIGH_INTENT') &&
      (signals?.intentToBook || messageMentionsBooking)
    ) {
      newStage = 'READY_TO_BOOK';
      reason = 'Prospect requested or agreed to an appointment';
    }

    // Calculate score (0-100)
    let score = 10;
    if (newStage === 'EXPLORING') score = 25;
    if (newStage === 'ENGAGED') score = 50;
    if (newStage === 'HIGH_INTENT') score = 75;
    if (newStage === 'READY_TO_BOOK') score = 90;
    if (newStage === 'HANDOFF_PENDING') score = 95;

    if (budgetTier === 'TIER_INSTITUTIONAL') score = Math.min(100, score + 10);
    if (decisionRole === 'SOLE_DECISION_MAKER') score = Math.min(100, score + 5);

    const scoreDelta = score - (previousStage === 'ANONYMOUS' ? 0 : 25);
    const confidence = Math.min(1.0, 0.4 + (identifiedNeeds.length * 0.1) + (budgetTier ? 0.2 : 0) + (purchaseHorizonDays ? 0.1 : 0));

    const updatedContext: QualificationContext = {
      stage: newStage,
      budgetTier,
      estimatedBudgetUsd,
      purchaseHorizonDays,
      decisionRole,
      confidenceScore: confidence,
      identifiedNeeds,
      keyObjectionsDetected,
      evaluatedAt: new Date().toISOString()
    };

    return {
      leadId,
      previousStage,
      newStage,
      scoreDelta,
      totalScore: score,
      confidence,
      context: updatedContext,
      shouldEscalate: newStage === 'READY_TO_BOOK' || (hasHighBudget && Boolean(signals?.intentToBook)),
      reason
    };
  }

  /**
   * Step 2: Deterministic Attribution Engine.
   * Resolves attribution records according to the tenant's policy (FIRST_TOUCH, LAST_TOUCH, EXPLICIT_REFERRAL).
   */
  static resolveAttribution(input: ResolveAttributionInput): AttributionContext {
    const { leadId, incomingReferralCode, incomingMedium, policy, existingContext, campaignSource } = input;
    const now = input.touchTimestamp ? new Date(input.touchTimestamp) : new Date();
    const expiresAt = new Date(now.getTime() + policy.windowDays * 86400 * 1000).toISOString();

    const history = existingContext ? [...existingContext.history] : [];
    const activeRecord = existingContext?.activeRecord;

    // Check if active attribution has expired
    const isExpired = activeRecord ? new Date(activeRecord.expiresAt) < now : false;

    // Case 1: Existing deterministic active attribution under FIRST_TOUCH policy
    if (
      policy.strategy === 'FIRST_TOUCH' &&
      activeRecord &&
      !isExpired &&
      !policy.allowBrokerOverride
    ) {
      return {
        activeRecord,
        history,
        isDeterministic: true,
        status: 'RESOLVED',
        policyApplied: 'FIRST_TOUCH'
      };
    }

    // Case 2: New incoming referral touchpoint
    if (incomingReferralCode) {
      const newRecord: AttributionRecord = {
        id: `attr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        leadId,
        referralCode: incomingReferralCode,
        campaignSource,
        medium: incomingMedium,
        touchTimestamp: now.toISOString(),
        expiresAt
      };

      history.push(newRecord);

      return {
        activeRecord: newRecord,
        history,
        isDeterministic: true,
        status: 'RESOLVED',
        policyApplied: policy.strategy
      };
    }

    // Case 3: No new referral code and active record exists (still valid)
    if (activeRecord && !isExpired) {
      return {
        activeRecord,
        history,
        isDeterministic: existingContext?.isDeterministic ?? false,
        status: 'RESOLVED',
        policyApplied: policy.strategy
      };
    }

    // Case 4: Unattributed / Expired
    return {
      activeRecord: undefined,
      history,
      isDeterministic: false,
      status: isExpired ? 'EXPIRED' : 'UNATTRIBUTED',
      policyApplied: policy.strategy
    };
  }

  /**
   * Step 5: Next Best Action Decider.
   * Maps current opportunity state to the optimal commercial action.
   */
  static determineNextBestAction(opportunity: RevenueOpportunity): {
    action: NextBestAction;
    reason: string;
    opportunityStage: OpportunityStage;
  } {
    const { qualification } = opportunity;

    if (qualification.stage === 'DISQUALIFIED') {
      return {
        action: 'CONTINUE_CONVERSATION',
        reason: 'Lead disqualified; maintain courteous conversational closure',
        opportunityStage: 'CLOSED_LOST'
      };
    }

    if (qualification.stage === 'READY_TO_BOOK') {
      return {
        action: 'PROPOSE_MEETING',
        reason: 'Prospect has verified intention to review proposals with an advisor',
        opportunityStage: 'COMMITTED'
      };
    }

    if (qualification.stage === 'HANDOFF_PENDING') {
      return {
        action: 'ESCALATE_HUMAN',
        reason: 'Ticket size or complexity requires senior closer intervention',
        opportunityStage: 'APPOINTMENT_SCHEDULED'
      };
    }

    if (qualification.stage === 'HIGH_INTENT') {
      return {
        action: 'SEND_DOCUMENTATION',
        reason: 'Prospect is evaluating options; deploy official project data room',
        opportunityStage: 'QUALIFIED'
      };
    }

    return {
      action: 'CONTINUE_CONVERSATION',
      reason: 'Continue active discovery and qualification dialogue',
      opportunityStage: 'DISCOVERY'
    };
  }

  /**
   * Step 8: Executive Handoff Assembler.
   * Compiles complete briefing for the assigned human sales rep or broker.
   */
  static compileExecutiveHandoff(params: {
    opportunity: RevenueOpportunity;
    leadName: string;
    contactIdentifier: string;
    primaryChannel: 'whatsapp' | 'telegram' | 'web';
    assignedBrokerId?: string;
    assignedBrokerName?: string;
    conversationSummary: string;
    appointmentDate?: string;
    meetingLink?: string;
    domainClosingAngleResolver?: (objections: string[], defaultAngle: string) => string;
    customClosingAngle?: string;
  }): ExecutiveHandoffSummary {
    const {
      opportunity,
      leadName,
      contactIdentifier,
      primaryChannel,
      assignedBrokerId,
      assignedBrokerName,
      conversationSummary,
      appointmentDate,
      meetingLink,
      domainClosingAngleResolver,
      customClosingAngle
    } = params;

    const { qualification } = opportunity;

    // Determine urgency
    let urgency: HandoffUrgency = 'NORMAL';
    if (qualification.budgetTier === 'TIER_PREMIUM' || qualification.budgetTier === 'TIER_INSTITUTIONAL') {
      urgency = 'HIGH';
    }
    if (appointmentDate && new Date(appointmentDate).getTime() - Date.now() < 24 * 3600 * 1000) {
      urgency = 'CRITICAL';
    }

    // Determine recommended closing angle:
    // Core remains 100% domain-agnostic. Specific angles are supplied via resolver or parameter.
    const defaultAgnosticAngle = 'Enfocarse en la propuesta de valor integral y los términos comerciales preferenciales.';
    let recommendedClosingAngle = customClosingAngle || defaultAgnosticAngle;

    if (domainClosingAngleResolver) {
      recommendedClosingAngle = domainClosingAngleResolver(qualification.keyObjectionsDetected, defaultAgnosticAngle);
    } else if (!customClosingAngle) {
      if (qualification.keyObjectionsDetected.some((o) => {
        const lower = o.toLowerCase();
        return lower.includes('legal') || lower.includes('contract') || lower.includes('certeza') || lower.includes('juridic');
      })) {
        recommendedClosingAngle = 'Priorizar la certeza contractual y la documentación oficial de respaldo.';
      } else if (qualification.keyObjectionsDetected.some((o) => {
        const lower = o.toLowerCase();
        return lower.includes('price') || lower.includes('cost') || lower.includes('roi') || lower.includes('renta') || lower.includes('rendimiento');
      })) {
        recommendedClosingAngle = 'Presentar la estructura financiera detallada y el retorno proyectado.';
      }
    }

    return {
      id: `handoff_${opportunity.id}_${Date.now()}`,
      leadId: opportunity.leadId,
      leadName,
      primaryChannel,
      contactIdentifier,
      assignedBrokerId,
      assignedBrokerName,
      urgency,
      opportunity: {
        interestSummary: qualification.identifiedNeeds.join(', ') || 'Interés general en el desarrollo',
        budgetEstimate: qualification.estimatedBudgetUsd ? `$${qualification.estimatedBudgetUsd.toLocaleString()} USD` : qualification.budgetTier,
        resolvedObjections: qualification.keyObjectionsDetected,
        unresolvedConcerns: [],
        appointmentDate,
        meetingLink
      },
      recommendedClosingAngle,
      conversationSummary,
      dispatchedAt: new Date().toISOString()
    };
  }
}
