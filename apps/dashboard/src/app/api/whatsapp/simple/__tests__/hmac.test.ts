// @ts-ignore
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createHmac } from 'crypto';
import { verifyMetaSignature } from '../route';
import { buildCanonicalWhatsAppConversationId, maskPhoneNumber } from '@/lib/whatsapp/utils/conversation-id';

describe('🛡️ Suite A: Meta WhatsApp HMAC & Identity Security', () => {
  const secret = 'super_secret_pandoras_webhook_key_2026';
  const samplePayload = JSON.stringify({
    entry: [
      {
        id: '123456789',
        changes: [
          {
            value: {
              messages: [{ from: '5215512345678', id: 'wamid.HBgLMTIz' }],
            },
            field: 'messages',
          },
        ],
      },
    ],
  });

  function generateSignature(body: string, appSecret: string): string {
    const hash = createHmac('sha256', appSecret).update(body).digest('hex');
    return `sha256=${hash}`;
  }

  it('SEC-01: Accepts valid HMAC-SHA256 signature calculated over raw body', () => {
    const validSignature = generateSignature(samplePayload, secret);
    const result = verifyMetaSignature(samplePayload, validSignature, secret);
    expect(result).toBe(true);
  });

  it('SEC-02: Rejects immediately when signature header is missing or null', () => {
    expect(verifyMetaSignature(samplePayload, null, secret)).toBe(false);
    expect(verifyMetaSignature(samplePayload, '', secret)).toBe(false);
  });

  it('SEC-03: Rejects invalid signature header format without sha256= prefix', () => {
    const rawHash = createHmac('sha256', secret).update(samplePayload).digest('hex');
    expect(verifyMetaSignature(samplePayload, rawHash, secret)).toBe(false);
  });

  it('SEC-04: Rejects tampered body payload (integrity breach detection)', () => {
    const originalSignature = generateSignature(samplePayload, secret);
    const tamperedPayload = samplePayload.replace('5215512345678', '5215599999999');
    const result = verifyMetaSignature(tamperedPayload, originalSignature, secret);
    expect(result).toBe(false);
  });

  it('SEC-05: Canonical Conversation ID derives deterministically from canonical identity and normalized phone', () => {
    const convHq = buildCanonicalWhatsAppConversationId('pandoras', '+52 1 (55) 1234-5678');
    expect(convHq).toBe('conv_wa_pandoras_5215512345678');

    const convTenant = buildCanonicalWhatsAppConversationId('org_snarai', '+5215587654321');
    expect(convTenant).toBe('conv_wa_snarai_5215587654321');

    // Both inbound and outbound with varying formatting yield exact same key
    const rawFromMeta = '5215512345678';
    const formInput = '+52 1 (55) 1234-5678';
    expect(buildCanonicalWhatsAppConversationId('pandoras', rawFromMeta))
      .toBe(buildCanonicalWhatsAppConversationId('pandoras', formInput));
  });

  it('SEC-06: PII Masking redacts telephone numbers for operational logs', () => {
    expect(maskPhoneNumber('+5215512345678')).toBe('+52 **** 5678');
    expect(maskPhoneNumber('1234')).toBe('****');
    expect(maskPhoneNumber(null)).toBe('N/A');
  });
});
