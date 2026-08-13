import { describe, it, expect, beforeEach } from './test-helpers';
import { TelegramAdapter } from '../adapters/telegram-adapter';
import { EnvironmentSecretResolver } from '../secret-resolver';
import { DatabaseBindingResolver } from '../binding-resolver';
import { InvalidChannelPayloadError } from '../channel-errors';

describe('TelegramAdapter', () => {
  let adapter: TelegramAdapter;
  let secretResolver: EnvironmentSecretResolver;
  let bindingResolver: DatabaseBindingResolver;

  beforeEach(() => {
    secretResolver = new EnvironmentSecretResolver({ 'env:TELEGRAM_BOT_TOKEN': 'test_bot_token_123' });
    bindingResolver = new DatabaseBindingResolver();
    bindingResolver.setMockBinding('999888', {
      id: 'bind_snarai',
      organizationId: 'snarai',
      channelType: 'telegram',
      channelIdentity: '@snarai_bot',
      credentialsRef: 'env:TELEGRAM_BOT_TOKEN',
      status: 'ACTIVE'
    });
    adapter = new TelegramAdapter(secretResolver, bindingResolver);
  });

  it('T1 — Normalizes Telegram Update JSON correctly', async () => {
    const normalized = await adapter.receive({
      channelType: 'telegram',
      externalId: '10001',
      rawPayload: {
        update_id: 10001,
        message: {
          message_id: 55,
          from: { id: 999888, username: 'oscar' },
          chat: { id: 999888, type: 'private' },
          date: 1700000000,
          text: 'Hola Hermes desde Telegram'
        }
      }
    });

    expect(normalized.channel.type).toBe('telegram');
    expect(normalized.message.content).toBe('Hola Hermes desde Telegram');
    expect(normalized.organizationId).toBe('snarai');
    expect(normalized.message.externalMessageId).toBe('10001');
    expect(normalized.idempotencyKey).toBe('snarai:telegram:10001');
    expect(normalized.correlationId).toBe('corr_tg_10001');
  });

  it('T2 — Rejects malformed Telegram Update JSON without text or update_id', async () => {
    await expect(
      adapter.receive({
        channelType: 'telegram',
        externalId: '10002',
        rawPayload: { update_id: 10002 } // Missing message
      })
    ).rejects.toThrow(InvalidChannelPayloadError);

    await expect(
      adapter.receive({
        channelType: 'telegram',
        externalId: '10003',
        rawPayload: {
          update_id: 10003,
          message: { message_id: 56, chat: { id: 1, type: 'private' }, date: 1, text: '   ' }
        }
      })
    ).rejects.toThrow(InvalidChannelPayloadError);
  });

  it('T3 — Formats and dispatches outbound messages', async () => {
    const result = await adapter.send({
      organizationId: 'snarai',
      conversationId: 'conv_telegram_snarai_999888',
      channelType: 'telegram',
      content: 'Respuesta de Hermes',
      correlationId: 'corr_123'
    });

    expect(result.success).toBe(true);
    expect(result.messageId).not.toBe('');
  });
});
