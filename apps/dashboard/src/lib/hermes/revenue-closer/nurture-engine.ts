/**
 * Hermes Revenue Closer — Unified Multichannel Nurture Engine
 * src/lib/hermes/revenue-closer/nurture-engine.ts
 *
 * Evaluates triggers across Email, WhatsApp, and Telegram.
 * Enforces quiet hours, cooldowns, consent, and channel policy.
 */

import {
  NurturePolicy,
  NurtureTriggerEvent,
  NurtureActionProposal,
  NurtureChannel
} from '../contracts/nurture';

export interface LeadNurtureState {
  leadId: string;
  totalFollowUpsSent: number;
  lastTouchTimestamp?: string;
  hasWhatsAppConsent: boolean;
  hasEmailConsent: boolean;
  email?: string;
  phoneNumber?: string;
}

export class NurtureEngine {
  /**
   * Default nurture policy for real estate leads.
   */
  static readonly DEFAULT_REAL_ESTATE_NURTURE_POLICY: NurturePolicy = {
    allowedChannels: ['EMAIL', 'WHATSAPP'],
    quietHoursStartUtc: 23, // 11 PM UTC (around 5-7 PM local time)
    quietHoursEndUtc: 13,   // 1 PM UTC (around 7-9 AM local time)
    maxFollowUpsPerLead: 5,
    cooldownHours: 24,
    requireExplicitConsentForPush: true
  };

  /**
   * Evaluates an incoming trigger event against policy and lead state.
   */
  static evaluateTrigger(
    event: NurtureTriggerEvent,
    leadState: LeadNurtureState,
    policy: NurturePolicy = this.DEFAULT_REAL_ESTATE_NURTURE_POLICY,
    currentTime: Date = new Date()
  ): {
    shouldTrigger: boolean;
    reason: string;
    proposal?: NurtureActionProposal;
  } {
    // 1. Max follow-ups cap check
    if (leadState.totalFollowUpsSent >= policy.maxFollowUpsPerLead) {
      return {
        shouldTrigger: false,
        reason: `Maximum follow-ups limit reached (${policy.maxFollowUpsPerLead})`
      };
    }

    // 2. Cooldown check
    if (leadState.lastTouchTimestamp) {
      const lastTouch = new Date(leadState.lastTouchTimestamp).getTime();
      const elapsedHours = (currentTime.getTime() - lastTouch) / (3600 * 1000);
      if (elapsedHours < policy.cooldownHours) {
        return {
          shouldTrigger: false,
          reason: `In cooldown period: ${elapsedHours.toFixed(1)}h elapsed (minimum ${policy.cooldownHours}h)`
        };
      }
    }

    // 3. Channel selection and proposal creation
    let targetChannel: NurtureChannel | null = null;
    let templateIdentifier = '';
    let priority: 'LOW' | 'NORMAL' | 'URGENT' = 'NORMAL';
    let proposalReason = '';

    switch (event.eventType) {
      case 'LEAD_INACTIVE_24H': {
        // Prefer Email for inactive lead (non-intrusive)
        if (policy.allowedChannels.includes('EMAIL') && leadState.email && leadState.hasEmailConsent) {
          targetChannel = 'EMAIL';
          templateIdentifier = 'real-estate-dossier-welcome';
          proposalReason = 'Lead inactive for 24h; sending executive project dossier';
        } else if (policy.allowedChannels.includes('WHATSAPP') && leadState.hasWhatsAppConsent && leadState.phoneNumber) {
          targetChannel = 'WHATSAPP';
          templateIdentifier = 'whatsapp_nurture_checkin';
          proposalReason = 'Lead inactive for 24h; sending gentle WhatsApp check-in';
        }
        break;
      }

      case 'DOCUMENT_VIEWED': {
        // High engagement: WhatsApp notification is appropriate if consented
        if (policy.allowedChannels.includes('WHATSAPP') && leadState.hasWhatsAppConsent && leadState.phoneNumber) {
          targetChannel = 'WHATSAPP';
          templateIdentifier = 'whatsapp_document_feedback';
          priority = 'NORMAL';
          proposalReason = 'Prospect opened Data Room document; prompt for questions';
        } else if (policy.allowedChannels.includes('EMAIL') && leadState.email) {
          targetChannel = 'EMAIL';
          templateIdentifier = 'real-estate-calculator-summary';
          proposalReason = 'Prospect engaged with documentation; offer financial calculator';
        }
        break;
      }

      case 'CALCULATOR_SIMULATION': {
        if (policy.allowedChannels.includes('EMAIL') && leadState.email) {
          targetChannel = 'EMAIL';
          templateIdentifier = 'real-estate-calculator-summary';
          priority = 'NORMAL';
          proposalReason = 'Prospect ran calculator projection; email formal summary';
        }
        break;
      }

      case 'MEETING_NO_SHOW': {
        priority = 'URGENT';
        if (policy.allowedChannels.includes('WHATSAPP') && leadState.hasWhatsAppConsent && leadState.phoneNumber) {
          targetChannel = 'WHATSAPP';
          templateIdentifier = 'whatsapp_reschedule_urgent';
          proposalReason = 'Missed scheduled appointment; offering immediate rescheduling';
        } else if (policy.allowedChannels.includes('EMAIL') && leadState.email) {
          targetChannel = 'EMAIL';
          templateIdentifier = 'real-estate-discovery-call-confirmed';
          proposalReason = 'Missed appointment; email rescheduling link';
        }
        break;
      }

      default:
        return {
          shouldTrigger: false,
          reason: `Unrecognized trigger event type: ${event.eventType}`
        };
    }

    if (!targetChannel) {
      return {
        shouldTrigger: false,
        reason: 'No eligible consented channel found for lead'
      };
    }

    // 4. Quiet hours check (WhatsApp cannot be sent during quiet hours)
    if (targetChannel === 'WHATSAPP') {
      const currentUtcHour = currentTime.getUTCHours();
      const isQuietHours = policy.quietHoursStartUtc > policy.quietHoursEndUtc
        ? (currentUtcHour >= policy.quietHoursStartUtc || currentUtcHour < policy.quietHoursEndUtc)
        : (currentUtcHour >= policy.quietHoursStartUtc && currentUtcHour < policy.quietHoursEndUtc);

      if (isQuietHours) {
        return {
          shouldTrigger: false,
          reason: `WhatsApp action suppressed during quiet hours (${policy.quietHoursStartUtc}:00 - ${policy.quietHoursEndUtc}:00 UTC)`
        };
      }
    }

    const proposal: NurtureActionProposal = {
      leadId: leadState.leadId,
      triggerEventId: event.id,
      channel: targetChannel,
      templateIdentifier,
      variables: {
        developmentName: (event.eventPayload.developmentName as string) || 'Desarrollo Inmobiliario',
        leadName: (event.eventPayload.leadName as string) || 'Inversionista',
        actionUrl: (event.eventPayload.actionUrl as string) || 'https://dash.pandoras.finance'
      },
      scheduledFor: currentTime.toISOString(),
      priority,
      reason: proposalReason
    };

    return {
      shouldTrigger: true,
      reason: proposalReason,
      proposal
    };
  }
}
