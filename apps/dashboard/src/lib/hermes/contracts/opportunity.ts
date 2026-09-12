/**
 * Hermes Revenue Closer — Opportunity Contracts
 * src/lib/hermes/contracts/opportunity.ts
 *
 * Models commercial opportunities generated through conversation.
 * Core opportunity is domain-agnostic; vertical details live in domainContext.
 */

import { QualificationContext } from './qualification';
import { AttributionContext } from './attribution';

export type OpportunityStage =
  | 'DISCOVERY'
  | 'QUALIFIED'
  | 'COMMITTED'
  | 'APPOINTMENT_SCHEDULED'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export type NextBestAction =
  | 'CONTINUE_CONVERSATION'
  | 'SEND_DOCUMENTATION'
  | 'TRIGGER_NURTURE'
  | 'PROPOSE_MEETING'
  | 'ESCALATE_HUMAN';

export interface RevenueOpportunity<TDomain = Record<string, unknown>> {
  id: string;
  leadId: string;
  organizationId: string;
  projectId?: string;
  stage: OpportunityStage;
  qualification: QualificationContext;
  attribution: AttributionContext;
  estimatedValueUsd?: number;
  probabilityPercentage: number; // 0 to 100
  nextBestAction: NextBestAction;
  nextActionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  /**
   * Generic domain extension payload.
   * Hermes Core NEVER hardcodes or inspects fields inside domainContext.
   */
  domainContext?: TDomain;
}
