import { describe, it, expect } from './test-helpers';
import { PortalAdapter } from '../adapters/portal-adapter';
import { TelegramAdapter } from '../adapters/telegram-adapter';
import { ControlPlaneContext } from '../../control-plane/application/context';
import { EnvironmentSecretResolver } from '../secret-resolver';
import { DatabaseBindingResolver } from '../binding-resolver';

describe('Cognitive Parity Certification (C5.12 & C5.13)', () => {
  it('C5.12 & C5.13 — Verifies Portal and Telegram messages normalize to identical Cognitive Contract', async () => {
    const portalAdapter = new PortalAdapter();
    const mockContext = new ControlPlaneContext(
      'sess_shared_123',
      'user_oscar',
      'admin',
      [],
      [{ organizationId: 'snarai', role: 'admin' }]
    );

    const secretResolver = new EnvironmentSecretResolver({ 'env:TELEGRAM_BOT_TOKEN': 'mock_token' });
    const bindingResolver = new DatabaseBindingResolver();
    bindingResolver.setMockBinding('555', {
      id: 'bind_snarai_tg',
      organizationId: 'snarai',
      channelType: 'telegram',
      channelIdentity: '@snarai_bot',
      credentialsRef: 'env:TELEGRAM_BOT_TOKEN',
      status: 'ACTIVE'
    });
    const telegramAdapter = new TelegramAdapter(secretResolver, bindingResolver);

    // 1. Process Portal Message
    const portalNormalized = await portalAdapter.receive(
      {
        channelType: 'portal',
        externalId: 'portal_msg_100',
        rawPayload: { content: 'Somos una desarrolladora inmobiliaria', clientMessageId: 'portal_msg_100' }
      },
      mockContext
    );

    // 2. Process Telegram Message for SAME Organization
    const telegramNormalized = await telegramAdapter.receive({
      channelType: 'telegram',
      externalId: '2001',
      rawPayload: {
        update_id: 2001,
        message: {
          message_id: 10,
          from: { id: 555 },
          chat: { id: 555, type: 'private' },
          date: 1700000000,
          text: 'Somos una desarrolladora inmobiliaria'
        }
      }
    });

    // 3. Cognitive Parity Verification
    expect(portalNormalized.organizationId).toBe(telegramNormalized.organizationId);
    expect(portalNormalized.message.content).toBe(telegramNormalized.message.content);

    // Both messages possess canonical properties for Cognitive Engine consumption
    expect(portalNormalized.channel.type).toBe('portal');
    expect(telegramNormalized.channel.type).toBe('telegram');

    expect(portalNormalized.correlationId).not.toBe('');
    expect(telegramNormalized.correlationId).not.toBe('');

    expect(portalNormalized.idempotencyKey).toContain('snarai:portal:');
    expect(telegramNormalized.idempotencyKey).toContain('snarai:telegram:');
  });
});
