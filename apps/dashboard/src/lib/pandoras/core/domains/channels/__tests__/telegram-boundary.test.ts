import { describe, it, expect, beforeEach } from './test-helpers';
import { TelegramAdapter } from '../adapters/telegram-adapter';
import { EnvironmentSecretResolver } from '../secret-resolver';
import { DatabaseBindingResolver } from '../binding-resolver';
import { DefaultOmnichannelGateway } from '../omnichannel-gateway';
import { DuplicateMessageError } from '../channel-errors';

describe('Telegram Security Boundary & Invariants (C5.11, C5.15, C5.17)', () => {
  let secretResolver: EnvironmentSecretResolver;
  let bindingResolver: DatabaseBindingResolver;
  let adapter: TelegramAdapter;
  let gateway: DefaultOmnichannelGateway;

  beforeEach(() => {
    secretResolver = new EnvironmentSecretResolver({ 'env:TELEGRAM_BOT_TOKEN': 'secret_token_val' });
    bindingResolver = new DatabaseBindingResolver();
    
    // Set explicit binding for chat 777 -> Tenant A (org_eld)
    bindingResolver.setMockBinding('777', {
      id: 'bind_eld',
      organizationId: 'org_eld',
      channelType: 'telegram',
      channelIdentity: '@eld_bot',
      credentialsRef: 'env:TELEGRAM_BOT_TOKEN',
      status: 'ACTIVE'
    });

    adapter = new TelegramAdapter(secretResolver, bindingResolver);
    gateway = new DefaultOmnichannelGateway();
  });

  it('C5.11 — Prevents tenant spoofing: Client-supplied organizationId is IGNORED', async () => {
    const normalized = await adapter.receive({
      channelType: 'telegram',
      externalId: '5001',
      rawPayload: {
        update_id: 5001,
        organizationId: 'MALICIOUS_TENANT_SNARAI', // ATTACK ATTEMPT
        message: {
          message_id: 1,
          from: { id: 777 },
          chat: { id: 777, type: 'private' },
          date: 1700000000,
          text: 'Attacking tenant isolation'
        }
      }
    });

    expect(normalized.organizationId).toBe('org_eld'); // Binding authority wins!
    expect(normalized.organizationId).not.toBe('MALICIOUS_TENANT_SNARAI');
  });

  it('C5.17 — Enforces idempotency on duplicate Telegram webhook updates', async () => {
    gateway.clearIdempotencyCache();

    const payload = {
      channelType: 'telegram' as const,
      externalId: 'dup_999',
      rawPayload: {
        update_id: 999,
        message: {
          message_id: 88,
          from: { id: 777 },
          chat: { id: 777, type: 'private' },
          date: 1700000000,
          text: 'Duplicate webhook test'
        }
      }
    };

    // First delivery -> PASS
    await gateway.receive(payload);

    // Second duplicate delivery -> IDEMPOTENT REJECTION
    await expect(gateway.receive(payload)).rejects.toThrow(DuplicateMessageError);
  });

  it('C5.15 — SecretResolver resolves secret without hardcoded bot tokens', async () => {
    const secret = await secretResolver.resolve('env:TELEGRAM_BOT_TOKEN');
    expect(secret).toBe('secret_token_val');
  });
});
