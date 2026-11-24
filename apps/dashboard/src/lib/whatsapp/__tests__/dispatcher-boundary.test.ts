// @ts-ignore
import { describe, it, expect, beforeEach } from 'vitest';
import { WhatsAppDispatcher } from '../dispatcher';
import { PlatformCapabilityRegistryService, PlatformActor } from '@saasfly/shared';

describe('🚪 Suite C: WhatsApp Dispatcher Boundary & Phone Registry', () => {
  const masterPhone = '109876543210';

  beforeEach(() => {
    // Canonical primary var is loaded from .env by bun; pin it to the test value
    // so it does not shadow the registry under test.
    process.env.HERMES_PHONE_NUMBER_ID = masterPhone;
    process.env.WHATSAPP_PHONE_NUMBER_ID = masterPhone;
    process.env.META_PHONE_NUMBER_ID = masterPhone;
  });

  it('BOUND-01: Unknown Phone Number ID is strictly REJECTED (Fail-Closed, No HQ fall-through)', async () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: {
                  phone_number_id: 'unknown_spoofed_or_unregistered_id_999',
                },
                messages: [
                  {
from: '5215500000000',
                  id: 'wamid.HBgLdW5rbm93bg==',
                  type: 'text',
                  text: { body: 'Ataque o mensaje espurio' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result = await WhatsAppDispatcher.dispatch(payload as any);
    expect(result.status).toBe('unrecognized_phone_number');
    expect(result.handled).toBe(false);
    expect(result.target).toBe('unrecognized');
  });

  it('BOUND-02: Master Phone Number ID routes correctly to Pandora HQ', async () => {
    const target = await WhatsAppDispatcher.resolveTargetByPhoneNumberId(masterPhone);
    expect(target).not.toBeNull();
    expect(target?.kind).toBe('PANDORAS_HQ');
    expect(target?.organizationId).toBe('pandoras');
    expect(target?.slug).toBe('pandoras');
  });

  it('BOUND-03: Tenant Hermes outreach capability is granted to AGENT_DELEGATE in scoped context', () => {
    const tenantAgent: PlatformActor = {
      id: 'agent_snarai',
      role: 'OPERATOR',
      actorType: 'AGENT_DELEGATE',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false,
    };

    const authCheck = PlatformCapabilityRegistryService.evaluateAuthorization(
      tenantAgent,
      'tenant.hermes.outreach',
      { tenantId: 'org_snarai' }
    );

    expect(authCheck.granted).toBe(true);
  });

  it('BOUND-04: Tenant Hermes agent is strictly blocked from executing Platform or HQ capabilities', () => {
    const tenantAgent: PlatformActor = {
      id: 'agent_snarai',
      role: 'OPERATOR',
      actorType: 'AGENT_DELEGATE',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false,
    };

    // Attempting to close deals or adjust credits is strictly denied
    const dealCloseCheck = PlatformCapabilityRegistryService.evaluateAuthorization(
      tenantAgent,
      'hq.crm.deal.close',
      { tenantId: 'org_snarai' }
    );
    expect(dealCloseCheck.granted).toBe(false);

    const sweepCheck = PlatformCapabilityRegistryService.evaluateAuthorization(
      tenantAgent,
      'platform.treasury.sweep',
      'all'
    );
    expect(sweepCheck.granted).toBe(false);
  });

  it('BOUND-05: Inbound flood from one phone is rate limited by the dispatcher', async () => {
    const { whatsappInboundRateLimiter } = await import('@saasfly/shared');
    WhatsAppDispatcher.resetDeduplicationForTesting();

    const phone = '5215599900011';
    const payload = (wamid: string) => ({
      entry: [{
        changes: [{
          value: {
            metadata: { phone_number_id: masterPhone },
            messages: [{ from: phone, id: wamid, type: 'text', text: { body: 'hola' } }],
          },
        }],
      }],
    });

    // Control: a phone with budget left is not rate limited.
    const first = await WhatsAppDispatcher.dispatch(payload('wamid.BOUND05.control') as any);
    expect(first.status).not.toBe('rate_limited');

    // Exhaust the same budget the dispatcher consumes (`wa:<phone>` keys).
    for (let i = 0; i < 30; i++) {
      await whatsappInboundRateLimiter.isAllowed(`wa:${phone}`);
    }

    const blocked = await WhatsAppDispatcher.dispatch(payload('wamid.BOUND05.blocked') as any);
    expect(blocked.status).toBe('rate_limited');
    expect(blocked.handled).toBe(true);
  });
});
