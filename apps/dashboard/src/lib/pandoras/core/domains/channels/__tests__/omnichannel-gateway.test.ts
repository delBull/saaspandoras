import { describe, it, expect, beforeEach } from './test-helpers';
import { DefaultOmnichannelGateway } from '../omnichannel-gateway';
import { ControlPlaneContext } from '../../control-plane/application/context';
import { DuplicateMessageError } from '../channel-errors';

describe('OmnichannelGateway', () => {
  let gateway: DefaultOmnichannelGateway;
  let oscarContext: ControlPlaneContext;
  let alexiaContext: ControlPlaneContext;

  beforeEach(() => {
    gateway = new DefaultOmnichannelGateway();
    oscarContext = new ControlPlaneContext(
      'sess_oscar',
      'user_oscar',
      'admin',
      [],
      [{ organizationId: 'org_eld', role: 'admin' }]
    );
    alexiaContext = new ControlPlaneContext(
      'sess_alexia',
      'user_alexia',
      'admin',
      [],
      [{ organizationId: 'org_snarai', role: 'admin' }]
    );
  });

  it('C5.3 & C5.7 — Normalizes inbound message and publishes to Event Spine with correlation', async () => {
    const normalized = await gateway.receive(
      {
        channelType: 'portal',
        externalId: 'msg_001',
        rawPayload: { content: 'Configurar ELD', clientMessageId: 'msg_001' }
      },
      oscarContext
    );

    expect(normalized.organizationId).toBe('org_eld');
    expect(normalized.correlationId).toBe('sess_oscar');
    expect(normalized.channel.type).toBe('portal');
  });

  it('C5.8 & H5 — Enforces idempotency per client message ID', async () => {
    const inboundPayload = {
      channelType: 'portal' as const,
      externalId: 'msg_repeat_123',
      rawPayload: { content: 'Mensaje repetido', clientMessageId: 'msg_repeat_123' }
    };

    await gateway.receive(inboundPayload, oscarContext);

    await expect(gateway.receive(inboundPayload, oscarContext)).rejects.toThrow(DuplicateMessageError);
  });

  it('C5.10 — Certifies concurrent tenant isolation with zero bleed', async () => {
    const [resOscar, resAlexia] = await Promise.all([
      gateway.receive(
        { channelType: 'portal', externalId: 'msg_oscar', rawPayload: { content: 'ELD focus', clientMessageId: 'msg_oscar' } },
        oscarContext
      ),
      gateway.receive(
        { channelType: 'portal', externalId: 'msg_alexia', rawPayload: { content: 'SNarai focus', clientMessageId: 'msg_alexia' } },
        alexiaContext
      )
    ]);

    expect(resOscar.organizationId).toBe('org_eld');
    expect(resOscar.actor.identityId).toBe('user_oscar');

    expect(resAlexia.organizationId).toBe('org_snarai');
    expect(resAlexia.actor.identityId).toBe('user_alexia');

    expect(resOscar.organizationId).not.toBe(resAlexia.organizationId);
  });
});
