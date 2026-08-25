import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HermesNotificationDispatcher, escapeHtml } from '../notification-dispatcher';
import * as routerModule from '@/lib/hermes/telegram-runtime/router';

describe('📢 Hermes OS Milestone 2.4 — Proactive Telegram Notifications & Human Escalation Dispatcher', () => {
  const TEST_BOT_TOKEN = '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_TEST_TOKEN';
  let dispatcher: HermesNotificationDispatcher;
  let sentMessages: Array<{ chatId: number; text: string; keyboard?: any }> = [];

  beforeEach(() => {
    sentMessages = [];
    dispatcher = new HermesNotificationDispatcher({
      botToken: TEST_BOT_TOKEN,
      tmaBaseUrl: 'https://dash.pandoras.finance',
      dedupeWindowMs: 10_000,
    });

    // Mock sendTelegramMessage
    vi.spyOn(routerModule, 'sendTelegramMessage').mockImplementation(
      async (token: string, chatId: number, text: string, replyMarkup?: any) => {
        sentMessages.push({ chatId, text, keyboard: replyMarkup });
        return { ok: true, result: { message_id: 12345 } };
      }
    );
  });

  it('NOTIF-001: escapeHtml sanitizes dangerous characters preventing Telegram HTML injection', () => {
    const malicious = '<script>alert("hacked & pwned")</script>';
    const safe = escapeHtml(malicious);
    expect(safe).toBe('&lt;script&gt;alert(&quot;hacked &amp; pwned&quot;)&lt;/script&gt;');
    expect(safe).not.toContain('<');
    expect(safe).not.toContain('>');
  });

  it('NOTIF-002: Formats and dispatches Fact Discovered notification with TMA deep link button', async () => {
    // Mock getNotifiableOperators
    vi.spyOn(dispatcher, 'getNotifiableOperators').mockResolvedValue([
      { telegramUserId: '555111222', name: 'Founder Marco', role: 'OWNER' },
    ]);

    const delivered = await dispatcher.dispatchFactDiscovered(
      '9079ecf5-8d96-4074-a74e-5e92ef43c3cc',
      "S'Narai Sanctuary",
      {
        factId: 'fact_k_123',
        dimension: 'financial',
        key: 'Precio Token Fase Semilla',
        content: 'El precio por fracción en Fase Semilla es de $1,250 USD con APY estimado del 14.5%.',
      }
    );

    expect(delivered).toBe(1);
    expect(sentMessages.length).toBe(1);

    const sent = sentMessages[0]!;
    expect(sent.chatId).toBe(555111222);
    expect(sent.text).toContain('Nuevo Hecho en Bóveda KNOW');
    expect(sent.text).toContain("S&#039;Narai Sanctuary");
    expect(sent.text).toContain('Precio Token Fase Semilla');
    expect(sent.text).toContain('$1,250 USD');

    // Verify inline WebApp button to TMA
    expect(sent.keyboard?.inline_keyboard?.[0]?.[0]?.text).toBe('📱 Validar en Mini App');
    expect(sent.keyboard?.inline_keyboard?.[0]?.[0]?.web_app?.url).toBe(
      'https://dash.pandoras.finance/tma?tenant=9079ecf5-8d96-4074-a74e-5e92ef43c3cc'
    );
  });

  it('NOTIF-003: Formats and dispatches Human Escalation alert with reason and summary', async () => {
    vi.spyOn(dispatcher, 'getNotifiableOperators').mockResolvedValue([
      { telegramUserId: '555111222', name: 'Founder Marco', role: 'OWNER' },
      { telegramUserId: '777888999', name: 'Admin Lead', role: 'ADMIN' },
    ]);

    const delivered = await dispatcher.dispatchHumanEscalation(
      '9079ecf5-8d96-4074-a74e-5e92ef43c3cc',
      "S'Narai Sanctuary",
      {
        chatId: '+525512345678',
        reason: 'Cliente solicita hablar con el director general para inversión de $50k USD',
        summary: 'Inversionista calificado de Monterrey con interés en 40 fracciones.',
        customerName: 'Roberto Garza',
      }
    );

    expect(delivered).toBe(2);
    expect(sentMessages.length).toBe(2);

    const msg = sentMessages[0]!;
    expect(msg.text).toContain('Escalación a Asesor Humano');
    expect(msg.text).toContain('+525512345678');
    expect(msg.text).toContain('inversión de $50k USD');
    expect(msg.text).toContain('Inversionista calificado de Monterrey');
    expect(msg.keyboard?.inline_keyboard?.[0]?.[0]?.text).toBe('📱 Abrir Command Center');
  });

  it('NOTIF-004: Formats and dispatches Security Alert (K26 / IPFS failure)', async () => {
    vi.spyOn(dispatcher, 'getNotifiableOperators').mockResolvedValue([
      { telegramUserId: '555111222', name: 'Founder Marco', role: 'OWNER' },
    ]);

    const delivered = await dispatcher.dispatchSecurityAlert(
      '9079ecf5-8d96-4074-a74e-5e92ef43c3cc',
      "S'Narai Sanctuary",
      {
        eventType: 'CROSS_TENANT_ATTEMPT',
        severity: 'CRITICAL',
        detail: 'Intento de lectura no autorizada bloqueado por política K26 sobre CID bafkrei_123',
      }
    );

    expect(delivered).toBe(1);
    expect(sentMessages.length).toBe(1);

    const msg = sentMessages[0]!;
    expect(msg.text).toContain('Alerta de Seguridad Hermes (K26)');
    expect(msg.text).toContain('CRITICAL');
    expect(msg.text).toContain('CROSS_TENANT_ATTEMPT');
    expect(msg.keyboard?.inline_keyboard?.[0]?.[0]?.text).toBe('📱 Ver Estado en Mini App');
  });

  it('NOTIF-005: Anti-Spam deduplication window suppresses identical consecutive alerts', async () => {
    vi.spyOn(dispatcher, 'getNotifiableOperators').mockResolvedValue([
      { telegramUserId: '555111222', name: 'Founder Marco', role: 'OWNER' },
    ]);

    // First dispatch -> OK
    const firstDelivered = await dispatcher.dispatchFactDiscovered(
      '9079ecf5-8d96-4074-a74e-5e92ef43c3cc',
      "S'Narai Sanctuary",
      {
        factId: 'fact_k_999',
        dimension: 'product',
        key: 'Amenidades',
        content: 'Cenote privado y spa holístico incluidos.',
      }
    );
    expect(firstDelivered).toBe(1);
    expect(sentMessages.length).toBe(1);

    // Immediate duplicate dispatch -> Suppressed
    const secondDelivered = await dispatcher.dispatchFactDiscovered(
      '9079ecf5-8d96-4074-a74e-5e92ef43c3cc',
      "S'Narai Sanctuary",
      {
        factId: 'fact_k_999',
        dimension: 'product',
        key: 'Amenidades',
        content: 'Cenote privado y spa holístico incluidos.',
      }
    );
    expect(secondDelivered).toBe(0);
    expect(sentMessages.length).toBe(1); // No new message sent
  });

  it('NOTIF-006: Returns 0 deliveries gracefully when tenant has no Telegram operators', async () => {
    vi.spyOn(dispatcher, 'getNotifiableOperators').mockResolvedValue([]);

    const delivered = await dispatcher.dispatchHumanEscalation(
      '9079ecf5-8d96-4074-a74e-5e92ef43c3cc',
      "S'Narai Sanctuary",
      {
        chatId: '+525599999999',
        reason: 'Sin operadores vinculados',
      }
    );

    expect(delivered).toBe(0);
    expect(sentMessages.length).toBe(0);
  });

  it('NOTIF-007: Security dedupe includes detail hash — distinct incidents of same type are BOTH delivered', async () => {
    vi.spyOn(dispatcher, 'getNotifiableOperators').mockResolvedValue([
      { telegramUserId: '555111222', name: 'Founder Marco', role: 'OWNER' },
    ]);

    const first = await dispatcher.dispatchSecurityAlert(
      '9079ecf5-8d96-4074-a74e-5e92ef43c3cc',
      "S'Narai Sanctuary",
      { eventType: 'K26_VIOLATION', severity: 'CRITICAL', detail: 'Incident A: replay from 1.2.3.4' }
    );
    const second = await dispatcher.dispatchSecurityAlert(
      '9079ecf5-8d96-4074-a74e-5e92ef43c3cc',
      "S'Narai Sanctuary",
      { eventType: 'K26_VIOLATION', severity: 'CRITICAL', detail: 'Incident B: forged signature artifact-x' }
    );

    expect(first).toBe(1);
    expect(second).toBe(1);
    expect(sentMessages.length).toBe(2);

    const third = await dispatcher.dispatchSecurityAlert(
      '9079ecf5-8d96-4074-a74e-5e92ef43c3cc',
      "S'Narai Sanctuary",
      { eventType: 'K26_VIOLATION', severity: 'CRITICAL', detail: 'Incident B: forged signature artifact-x' }
    );
    expect(third).toBe(0);
    expect(sentMessages.length).toBe(2);
  });

  it('NOTIF-008: Resolution DB failure propagates instead of silently delivering zero (fail-loud)', async () => {
    vi.spyOn(dispatcher, 'getNotifiableOperators').mockRejectedValue(
      new Error('MEMBERSHIP_DB_UNAVAILABLE')
    );

    await expect(
      dispatcher.dispatchSecurityAlert(
        '9079ecf5-8d96-4074-a74e-5e92ef43c3cc',
        "S'Narai Sanctuary",
        { eventType: 'IPFS_DEGRADED', severity: 'CRITICAL', detail: 'Dual-mirror unreachable' }
      )
    ).rejects.toThrow('MEMBERSHIP_DB_UNAVAILABLE');

    expect(sentMessages.length).toBe(0);
  });
});
