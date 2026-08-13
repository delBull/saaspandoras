import { describe, it, expect } from './test-helpers';
import { ChannelType, ChannelInboundMessage } from '../channel-types';
import { NormalizedInboundMessage } from '../normalized-message';
import { OrganizationChannelBinding } from '../channel-binding-types';

describe('Channel Domain Contracts', () => {
  it('should validate ChannelType allowed values', () => {
    const portalChannel: ChannelType = 'portal';
    const telegramChannel: ChannelType = 'telegram';
    expect(portalChannel).toBe('portal');
    expect(telegramChannel).toBe('telegram');
  });

  it('should construct valid ChannelInboundMessage and NormalizedInboundMessage', () => {
    const rawInbound: ChannelInboundMessage = {
      channelType: 'portal',
      externalId: 'ext-123',
      rawPayload: { content: 'Test message' }
    };

    const normalized: NormalizedInboundMessage = {
      organizationId: 'org_snarai',
      channel: 'portal',
      conversationId: 'conv_portal_snarai',
      identityId: 'actor_123',
      messageId: 'msg_001',
      externalMessageId: 'ext-123',
      content: 'Test message',
      correlationId: 'corr_456',
      idempotencyKey: 'org_snarai:portal:ext-123',
      receivedAt: new Date()
    };

    expect(rawInbound.channelType).toBe('portal');
    expect(normalized.organizationId).toBe('org_snarai');
    expect(normalized.idempotencyKey).toContain('org_snarai:portal:ext-123');
  });

  it('should define binding without leaking raw secret tokens', () => {
    const binding: OrganizationChannelBinding = {
      id: 'bind_001',
      organizationId: 'org_snarai',
      channelType: 'telegram',
      channelIdentity: '@snarai_bot',
      credentialsRef: 'vault:secret:telegram_bot_token_snarai',
      status: 'ACTIVE'
    };

    expect(binding.credentialsRef).not.toContain('botToken');
    expect(binding.status).toBe('ACTIVE');
  });
});
