import { describe, it, expect } from 'vitest';
import { NurtureEngine, LeadNurtureState } from '../nurture-engine';
import { NurtureTriggerEvent, NurturePolicy } from '../../contracts/nurture';

describe('Hermes Multichannel Nurture Engine — Phase 4 Test Suite', () => {
  const baseLeadState: LeadNurtureState = {
    leadId: 'lead-789',
    totalFollowUpsSent: 1,
    lastTouchTimestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), // 36 hours ago (cooldown clear)
    hasWhatsAppConsent: true,
    hasEmailConsent: true,
    email: 'carlos@empresa.com',
    phoneNumber: '+5213221234567'
  };

  const activeHoursTime = new Date('2026-09-12T16:00:00Z'); // 16:00 UTC (outside quiet hours 23:00 - 13:00)
  const quietHoursTime = new Date('2026-09-12T02:00:00Z');  // 02:00 UTC (inside quiet hours)

  it('triggers email dossier for lead inactive for 24h', () => {
    const event: NurtureTriggerEvent = {
      id: 'evt-1',
      leadId: 'lead-789',
      eventType: 'LEAD_INACTIVE_24H',
      occurredAt: activeHoursTime.toISOString(),
      eventPayload: {
        developmentName: 'Punta Bahía',
        leadName: 'Carlos Mendoza'
      }
    };

    const result = NurtureEngine.evaluateTrigger(event, baseLeadState, undefined, activeHoursTime);

    expect(result.shouldTrigger).toBe(true);
    expect(result.proposal?.channel).toBe('EMAIL');
    expect(result.proposal?.templateIdentifier).toBe('real-estate-dossier-welcome');
    expect(result.proposal?.variables.developmentName).toBe('Punta Bahía');
  });

  it('suppresses WhatsApp action during quiet hours', () => {
    const leadStatePastCooldown: LeadNurtureState = {
      ...baseLeadState,
      lastTouchTimestamp: new Date(quietHoursTime.getTime() - 48 * 3600 * 1000).toISOString() // 48h before quietHoursTime
    };

    const event: NurtureTriggerEvent = {
      id: 'evt-2',
      leadId: 'lead-789',
      eventType: 'DOCUMENT_VIEWED',
      occurredAt: quietHoursTime.toISOString(),
      eventPayload: {
        documentTitle: 'Fideicomiso.pdf'
      }
    };

    const result = NurtureEngine.evaluateTrigger(event, leadStatePastCooldown, undefined, quietHoursTime);

    expect(result.shouldTrigger).toBe(false);
    expect(result.reason).toContain('quiet hours');
  });

  it('suppresses trigger when in cooldown period', () => {
    const inCooldownLead: LeadNurtureState = {
      ...baseLeadState,
      lastTouchTimestamp: new Date(activeHoursTime.getTime() - 4 * 3600 * 1000).toISOString() // only 4h ago
    };

    const event: NurtureTriggerEvent = {
      id: 'evt-3',
      leadId: 'lead-789',
      eventType: 'LEAD_INACTIVE_24H',
      occurredAt: activeHoursTime.toISOString(),
      eventPayload: {}
    };

    const result = NurtureEngine.evaluateTrigger(event, inCooldownLead, undefined, activeHoursTime);

    expect(result.shouldTrigger).toBe(false);
    expect(result.reason).toContain('cooldown');
  });

  it('suppresses trigger when max follow-up cap is reached', () => {
    const cappedLead: LeadNurtureState = {
      ...baseLeadState,
      totalFollowUpsSent: 5 // Default policy max is 5
    };

    const event: NurtureTriggerEvent = {
      id: 'evt-4',
      leadId: 'lead-789',
      eventType: 'LEAD_INACTIVE_24H',
      occurredAt: activeHoursTime.toISOString(),
      eventPayload: {}
    };

    const result = NurtureEngine.evaluateTrigger(event, cappedLead, undefined, activeHoursTime);

    expect(result.shouldTrigger).toBe(false);
    expect(result.reason).toContain('Maximum follow-ups limit reached');
  });

  it('assigns URGENT priority to MEETING_NO_SHOW events', () => {
    const event: NurtureTriggerEvent = {
      id: 'evt-5',
      leadId: 'lead-789',
      eventType: 'MEETING_NO_SHOW',
      occurredAt: activeHoursTime.toISOString(),
      eventPayload: {
        appointmentDate: '2026-09-12T15:00:00Z'
      }
    };

    const result = NurtureEngine.evaluateTrigger(event, baseLeadState, undefined, activeHoursTime);

    expect(result.shouldTrigger).toBe(true);
    expect(result.proposal?.priority).toBe('URGENT');
    expect(result.proposal?.channel).toBe('WHATSAPP');
    expect(result.proposal?.templateIdentifier).toBe('whatsapp_reschedule_urgent');
  });
});
