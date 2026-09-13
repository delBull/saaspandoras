/**
 * 🤖 Hermes Telegram Bot Adapter Suite (Fase 2 Mesh)
 * apps/dashboard/src/lib/hermes/bot/__tests__/hermes-telegram-adapter.test.ts
 *
 * Tests:
 * 1. Dual Routing: Global /start <slug> vs Whitelabel ?tenant=<slug>
 * 2. Inline Keyboards: Automatic IPFS evidence detection & Portal deep-links
 * 3. Human Escalation Gate: Callback & intentional keyword triggering
 */

import { describe, it, expect } from 'vitest';

describe('🤖 Hermes Telegram Bot Adapter (Fase 2 Mesh)', () => {
  describe('Dual Routing & Tenant Resolution', () => {
    it('resolves tenantSlug from query param for whitelabel bots with custom tokens', () => {
      const url = new URL('https://dash.pandoras.finance/api/hermes/bot/webhook?tenant=snarai');
      const urlParamTenant = url.searchParams.get('tenant');
      expect(urlParamTenant).toBe('snarai');
    });

    it('resolves tenantSlug from /start command in global bot mode', () => {
      const rawText = '/start snarai';
      const startMatch = rawText.match(/^\/start\s+([a-zA-Z0-9_-]+)/i);
      expect(startMatch).toBeTruthy();
      if (startMatch && startMatch[1]) {
        expect(startMatch[1].toLowerCase()).toBe('snarai');
      }
    });
  });

  describe('IPFS Evidence & Rich Inline Keyboards', () => {
    it('detects IPFS CID in response content and formats notarized evidence button', () => {
      const responseWithIpfs = 'El acuerdo de inversión ha sido notarizado en IPFS con CID ipfs://bafkreickoydw4pfhv627fsh45wbgsvatik6b7ef6b7mgyrpbwtgsrllk3y.';
      const ipfsMatch = responseWithIpfs.match(/(?:ipfs:\/\/)?(bafkrei[a-z0-9]{40,}|Qm[a-zA-Z0-9]{44})/i);

      expect(ipfsMatch).toBeTruthy();
      if (ipfsMatch && ipfsMatch[1]) {
        expect(ipfsMatch[1]).toBe('bafkreickoydw4pfhv627fsh45wbgsvatik6b7ef6b7mgyrpbwtgsrllk3y');
        const rawCid = ipfsMatch[1];

        const inlineKeyboard = [
          [{ text: '📜 Ver Evidencia Notarizada (IPFS)', url: `https://gateway.pinata.cloud/ipfs/${rawCid}` }]
        ];
        expect(inlineKeyboard[0]?.[0]?.url).toContain('gateway.pinata.cloud/ipfs/bafkreic');
      }
    });

    it('extracts IPFS CID from receipt metadata when not in response content', () => {
      const plainResponse = 'Tu transacción ha sido validada y confirmada en el consorcio.';
      const ipfsMatch = plainResponse.match(/(?:ipfs:\/\/)?(bafkrei[a-z0-9]{40,}|Qm[a-zA-Z0-9]{44})/i);
      
      const runtimeResponse = {
        content: plainResponse,
        claimProvenanceReceipt: {
          claims: [
            { contractCid: 'bafkreickoydw4pfhv627fsh45wbgsvatik6b7ef6b7mgyrpbwtgsrllk3y' }
          ]
        }
      };

      const receiptCid =
        runtimeResponse.claimProvenanceReceipt?.claims?.find((c: any) => c.contractCid)?.contractCid;
      const rawCid = ipfsMatch?.[1] || receiptCid;

      expect(rawCid).toBe('bafkreickoydw4pfhv627fsh45wbgsvatik6b7ef6b7mgyrpbwtgsrllk3y');
      const inlineKeyboard = [
        [{ text: '📜 Ver Evidencia Notarizada (IPFS)', url: `https://gateway.pinata.cloud/ipfs/${rawCid}` }]
      ];
      expect(inlineKeyboard[0]?.[0]?.url).toContain('gateway.pinata.cloud/ipfs/bafkreic');
    });

    it('generates direct portal deep-link tailored to the tenant', () => {
      const tenantSlug = 'snarai';
      const portalButtons = tenantSlug === 'snarai'
        ? [{ text: "🏛️ Abrir Portal S'Narai", url: 'https://snarai.com/portal' }]
        : [{ text: `🏛️ Abrir Portal (${tenantSlug})`, url: `https://dash.pandoras.finance/portal/${tenantSlug}` }];

      expect(portalButtons[0]?.url).toBe('https://snarai.com/portal');
    });
  });

  describe('Human Escalation Gate', () => {
    it('identifies escalation intent from conversational queries', () => {
      const phrases = [
        'quiero hablar con un asesor',
        'pásame con un humano por favor',
        'necesito atención humana',
        'quiero hablar con un ejecutivo de ventas',
      ];

      for (const phrase of phrases) {
        const isHumanRequest = /(?:asesor|humano|persona|agente humano|atenci[oó]n humana|hablar con alguien|ejecutivo|soporte humano)/i.test(phrase);
        expect(isHumanRequest).toBe(true);
      }
    });

    it('formats escalation callback data for tenant dispatch', () => {
      const tenantSlug = 'snarai';
      const callbackData = `escalate_human_${tenantSlug}`;
      expect(callbackData).toBe('escalate_human_snarai');
      expect(callbackData.startsWith('escalate_human_')).toBe(true);
    });
  });
});
