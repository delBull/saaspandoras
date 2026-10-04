/**
 * Hermes Revenue Closer — Executive Handoff Contracts
 * src/lib/hermes/contracts/handoff.ts
 *
 * Models structured briefings sent to human sales reps / brokers.
 * Prepares the human with complete context, objection history, and closing angles.
 */

export type HandoffUrgency = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface ExecutiveHandoffOpportunityContext {
  interestSummary: string;
  budgetEstimate?: string;
  resolvedObjections: string[];
  unresolvedConcerns: string[];
  appointmentDate?: string;
  meetingLink?: string;
}

export interface ExecutiveHandoffSummary {
  id: string;
  leadId: string;
  leadName: string;
  primaryChannel: 'whatsapp' | 'telegram' | 'web';
  contactIdentifier: string;
  assignedBrokerId?: string;
  assignedBrokerName?: string;
  urgency: HandoffUrgency;
  opportunity: ExecutiveHandoffOpportunityContext;
  recommendedClosingAngle: string;
  conversationSummary: string;
  dispatchedAt: string;
}

export interface HandoffDispatchResult {
  success: boolean;
  handoffId: string;
  recipientChannel: 'telegram_push' | 'whatsapp_push' | 'crm_notification' | 'email';
  deliveredAt: string;
}
