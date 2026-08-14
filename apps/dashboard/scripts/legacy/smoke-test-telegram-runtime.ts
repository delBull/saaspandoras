import { DefaultOmnichannelGateway } from '../../src/lib/pandoras/core/domains/channels/omnichannel-gateway';
import { DatabaseBindingResolver } from '../../src/lib/pandoras/core/domains/channels/binding-resolver';
import { EnvironmentSecretResolver } from '../../src/lib/pandoras/core/domains/channels/secret-resolver';
import { TelegramAdapter } from '../../src/lib/pandoras/core/domains/channels/adapters/telegram-adapter';
import { DuplicateMessageError } from '../../src/lib/pandoras/core/domains/channels/channel-errors';

async function runTelegramSmokeTests() {
  console.log('--------------------------------------------------');
  console.log('🚀 Running Phase 6.5.2 Telegram Operational Smoke Test Suite');
  console.log('--------------------------------------------------');

  const secretResolver = new EnvironmentSecretResolver({ 'env:TELEGRAM_BOT_TOKEN': 'mock_token_123' });
  const bindingResolver = new DatabaseBindingResolver();
  
  // Register active binding for Chat 888999 -> Tenant 'snarai'
  bindingResolver.setMockBinding('888999', {
    id: 'bind_snarai_tg',
    organizationId: 'snarai',
    channelType: 'telegram',
    channelIdentity: '@snarai_bot',
    credentialsRef: 'env:TELEGRAM_BOT_TOKEN',
    status: 'ACTIVE'
  });

  const adapter = new TelegramAdapter(secretResolver, bindingResolver);
  const gateway = new DefaultOmnichannelGateway();

  // Test A — Inbound Delivery
  console.log('\n[Test A] Testing Inbound Delivery via Telegram Adapter...');
  const msgA = await adapter.receive({
    channelType: 'telegram',
    externalId: '7001',
    rawPayload: {
      update_id: 7001,
      message: {
        message_id: 101,
        from: { id: 888999, username: 'oscar' },
        chat: { id: 888999, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: 'Hola Hermes desde Telegram'
      }
    }
  });

  if (msgA.organizationId === 'snarai' && msgA.channel === 'telegram') {
    console.log('✅ [Test A PASSED]: Inbound normalization valid.');
  } else {
    throw new Error('[Test A FAILED]: Inbound normalization mismatch.');
  }

  // Test B — Gateway Event Spine Dispatch & Context Continuity
  console.log('\n[Test B] Testing Gateway Event Spine Dispatch & Context Continuity...');
  const normGateway = await gateway.receive({
    channelType: 'telegram',
    externalId: '7002',
    rawPayload: {
      update_id: 7002,
      message: {
        message_id: 102,
        from: { id: 888999, username: 'oscar' },
        chat: { id: 888999, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: 'Mi empresa es del rubro inmobiliario.'
      }
    }
  });

  if (normGateway.conversationId === 'conv_telegram_snarai_888999' && normGateway.correlationId.startsWith('corr_tg_')) {
    console.log('✅ [Test B PASSED]: Gateway conversation & correlation continuity verified.');
  } else {
    throw new Error('[Test B FAILED]: Conversation continuity mismatch.');
  }

  // Test C — Idempotency Re-injection
  console.log('\n[Test C] Testing Duplicate Telegram Webhook Idempotency...');
  try {
    await gateway.receive({
      channelType: 'telegram',
      externalId: '7002', // Duplicate update_id
      rawPayload: {
        update_id: 7002,
        message: {
          message_id: 102,
          from: { id: 888999, username: 'oscar' },
          chat: { id: 888999, type: 'private' },
          date: Math.floor(Date.now() / 1000),
          text: 'Mi empresa es del rubro inmobiliario.'
        }
      }
    });
    throw new Error('[Test C FAILED]: Expected DuplicateMessageError but gateway allowed duplicate.');
  } catch (err: any) {
    if (err instanceof DuplicateMessageError) {
      console.log('✅ [Test C PASSED]: Duplicate update blocked by idempotency key.');
    } else {
      throw err;
    }
  }

  // Test D — Anti-Spoofing Tenant Binding Authority (C5.11)
  console.log('\n[Test D] Testing Anti-Spoofing Tenant Binding Authority (C5.11)...');
  const msgD = await adapter.receive({
    channelType: 'telegram',
    externalId: '7003',
    rawPayload: {
      update_id: 7003,
      organizationId: 'MALICIOUS_TENANT_ATTACK',
      message: {
        message_id: 103,
        from: { id: 888999, username: 'attacker' },
        chat: { id: 888999, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: 'Ataque de spoofing de tenant'
      }
    }
  });

  if (msgD.organizationId === 'snarai' && (msgD.organizationId as string) !== 'MALICIOUS_TENANT_ATTACK') {
    console.log('✅ [Test D PASSED]: Client-supplied organizationId ignored; binding authority enforced.');
  } else {
    throw new Error('[Test D FAILED]: Tenant spoofing vulnerability detected!');
  }

  // Test E — Outbound Dispatch via SecretResolver
  console.log('\n[Test E] Testing Outbound Dispatch via SecretResolver...');
  const sendResult = await adapter.send({
    organizationId: 'snarai',
    conversationId: 'conv_telegram_snarai_888999',
    channelType: 'telegram',
    content: 'Hola Óscar, tu proyecto inmobiliario está registrado.',
    correlationId: 'corr_tg_7003'
  });

  if (sendResult.success) {
    console.log('✅ [Test E PASSED]: Outbound message dispatch simulated cleanly.');
  } else {
    throw new Error('[Test E FAILED]: Outbound dispatch error.');
  }

  console.log('\n--------------------------------------------------');
  console.log('🎉 ALL TELEGRAM OPERATIONAL SMOKE TESTS PASSED CLEANLY!');
  console.log('--------------------------------------------------');
}

runTelegramSmokeTests().catch((err) => {
  console.error('❌ Smoke test suite failed:', err);
  process.exit(1);
});
