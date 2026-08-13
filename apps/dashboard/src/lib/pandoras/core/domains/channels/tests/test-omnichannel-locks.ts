import { OutboundRouter } from '../outbound-router';
import { RedisIdempotencyStore } from '../idempotency-store';
import { ExecutionContext } from '../channel-types';

async function runTests() {
  console.log('--- Running Omnichannel Locks Test Suite ---');
  let passed = 0;
  let failed = 0;

  const idempotencyStore = new RedisIdempotencyStore();
  const router = new OutboundRouter(idempotencyStore);

  const assert = (condition: boolean, testName: string, errorMessage?: string) => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${errorMessage || 'Assertion failed'}`);
      failed++;
    }
  };

  // Test C5.19-B: Binding Authority
  try {
    const ctx: ExecutionContext = {
      organizationId: 'snarai',
      conversationId: 'conv_123',
      channelBindingId: 'bind_wa_15551234567', // WhatsApp mock dev binding
      correlationId: 'corr_test_1',
      idempotencyKey: 'idem_test_c519_' + Date.now()
    };
    
    // We send content, it should route to WhatsApp Adapter based on binding
    const result = await router.route(ctx, "Test Message");
    assert(!!result.messageId?.startsWith('wa_outbound_'), 'C5.19-B: OutboundRouter respects authoritative binding (routes to WhatsApp)');
  } catch (err: any) {
    assert(false, 'C5.19-B: OutboundRouter threw an error', err.message);
  }

  // Test C5.20-A: Concurrent Duplicate Idempotency
  try {
    const idemKey = 'idem_test_c520_duplicate_' + Date.now();
    const ctx: ExecutionContext = {
      organizationId: 'snarai',
      conversationId: 'conv_123',
      channelBindingId: 'bind_tg_user_123',
      correlationId: 'corr_test_2',
      idempotencyKey: idemKey
    };

    // Simulate concurrent dispatch
    const p1 = router.route(ctx, "Message 1");
    const p2 = router.route(ctx, "Message 1"); // Exact same idempotency key

    const [res1, res2] = await Promise.all([p1, p2]);

    const skippedOne = res1.messageId === 'SKIPPED_DUPLICATE' || res2.messageId === 'SKIPPED_DUPLICATE';
    const sentOne = !!res1.messageId?.startsWith('tg_outbound_') || !!res2.messageId?.startsWith('tg_outbound_');

    assert(skippedOne && sentOne, 'C5.20-A: Concurrent dispatches with same key correctly skip the duplicate');
  } catch (err: any) {
    assert(false, 'C5.20-A: Idempotency test threw an error', err.message);
  }

  console.log(`\nTests Completed: ${passed} passed, ${failed} failed.`);
}

if (require.main === module) {
  runTests().catch(console.error).finally(() => process.exit(0));
}
