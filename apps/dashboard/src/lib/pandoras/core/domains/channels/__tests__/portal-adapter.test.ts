import { describe, it, expect, beforeEach } from './test-helpers';
import { PortalAdapter } from '../adapters/portal-adapter';
import { ControlPlaneContext } from '../../control-plane/application/context';
import { InvalidChannelPayloadError } from '../channel-errors';

describe('PortalAdapter', () => {
  let adapter: PortalAdapter;
  let mockContext: ControlPlaneContext;

  beforeEach(() => {
    adapter = new PortalAdapter();
    mockContext = new ControlPlaneContext(
      'session_123',
      'user_oscar',
      'admin',
      [],
      [{ organizationId: 'org_eld', role: 'admin' }]
    );
  });

  it('P1 — Normalizes Portal message input correctly', async () => {
    const normalized = await adapter.receive(
      {
        channelType: 'portal',
        externalId: 'client-msg-001',
        rawPayload: { content: 'Hola Hermes desde el Portal', clientMessageId: 'client-msg-001' }
      },
      mockContext
    );

    expect(normalized.channel).toBe('portal');
    expect(normalized.content).toBe('Hola Hermes desde el Portal');
    expect(normalized.organizationId).toBe('org_eld');
    expect(normalized.identityId).toBe('user_oscar');
    expect(normalized.conversationId).toBe('conv_portal_org_eld');
    expect(normalized.externalMessageId).toBe('client-msg-001');
    expect(normalized.idempotencyKey).toBe('org_eld:portal:client-msg-001');
    expect(normalized.correlationId).toBe('session_123');
  });

  it('P2 & P3 — Enforces tenant authority and ignores client-supplied organizationId', async () => {
    const normalized = await adapter.receive(
      {
        channelType: 'portal',
        externalId: 'client-msg-002',
        rawPayload: {
          content: 'Intento de spoofing',
          organizationId: 'malicious_tenant_snarai' // SHOULD BE IGNORED
        }
      },
      mockContext
    );

    expect(normalized.organizationId).toBe('org_eld'); // Authorized context wins!
  });

  it('Rejects payload with missing content or unauthenticated context', async () => {
    await expect(
      adapter.receive(
        { channelType: 'portal', externalId: 'ext-1', rawPayload: { content: '' } },
        mockContext
      )
    ).rejects.toThrow(InvalidChannelPayloadError);

    await expect(
      adapter.receive(
        { channelType: 'portal', externalId: 'ext-1', rawPayload: { content: 'Hola' } },
        undefined
      )
    ).rejects.toThrow(InvalidChannelPayloadError);
  });
});
