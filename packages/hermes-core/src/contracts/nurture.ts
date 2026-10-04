/**
 * Hermes Revenue Closer — Nurture Engine Contracts
 * src/lib/hermes/contracts/nurture.ts
 *
 * Unified reactive follow-up engine across email, WhatsApp, and Telegram.
 * Channel selection is governed by consent, frequency, and quiet hours.
 */

export type NurtureChannel = 'WHATSAPP' | 'EMAIL' | 'TELEGRAM';

export type NurtureTriggerType =
  | 'LEAD_INACTIVE_24H'
  | 'DOCUMENT_VIEWED'
  | 'CALCULATOR_SIMULATION'
  | 'MEETING_NO_SHOW'
  | 'PRICE_UPDATE'
  | 'INVENTORY_ALERT';

export interface NurtureTriggerEvent {
  id: string;
  leadId: string;
  eventType: NurtureTriggerType;
  occurredAt: string;
  eventPayload: Record<string, unknown>;
}

export interface NurturePolicy {
  allowedChannels: NurtureChannel[];
  quietHoursStartUtc: number; // e.g. 22 (10 PM)
  quietHoursEndUtc: number;   // e.g. 8 (8 AM)
  maxFollowUpsPerLead: number;
  cooldownHours: number;
  requireExplicitConsentForPush: boolean;
}

export interface NurtureActionProposal {
  leadId: string;
  triggerEventId: string;
  channel: NurtureChannel;
  templateIdentifier: string;
  variables: Record<string, string>;
  scheduledFor: string;
  priority: 'LOW' | 'NORMAL' | 'URGENT';
  reason: string;
}
