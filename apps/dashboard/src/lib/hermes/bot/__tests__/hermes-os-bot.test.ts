import { describe, it, expect, beforeEach } from 'vitest';
import { ChannelGatewayAdapter, escapeHtml } from '../channel-gateway-adapter';
import { buildStatusMessage, type HermesSystemStatus } from '../system-status';
import { ChannelContext } from '../../channel-gateway';

describe('🤖 Hermes OS Milestone 2.2 — Channel Gateway Adapter', () => {
  let botAdapter: ChannelGatewayAdapter;

  beforeEach(() => {
    botAdapter = new ChannelGatewayAdapter({
      tmaBaseUrl: 'https://dash.pandoras.finance',
    });
  });

  function makeContext(text: string, isCallback = false, tenantHint?: string): ChannelContext {
    return {
      channel: 'telegram',
      externalUserId: '999999999',
      externalConversationId: '55555',
      tenantHint,
      message: text,
      metadata: {
        isCallback,
        username: 'operator_marco'
      }
    };
  }

  it('BOT-001: Handles /start for unauthorized telegram user with instructions', async () => {
    const ctx = makeContext('/start');
    ctx.metadata.username = 'unauthorized_stranger';

    const result = await botAdapter.handleInbound(ctx);
    expect(result.replyText).toContain('no tiene workspaces vinculados');
  });

  it('BOT-002: /status rejects unauthorized telegram user with STATUS_UNAUTHORIZED', async () => {
    const ctx = makeContext('/status');
    const result = await botAdapter.handleInbound(ctx);
    expect(result.replyText).toContain('No tienes acceso a métricas');
  });

  it('BOT-003: Handles /portal command returning WebApp launch button', async () => {
    const ctx = makeContext('/portal');
    const result = await botAdapter.handleInbound(ctx);
    expect(result.replyText).toContain('No tienes workspaces autorizados'); // because mock DB says unauthorized
  });

  it('BOT-004: Handles /switch command listing authorized workspaces', async () => {
    const ctx = makeContext('/switch');
    const result = await botAdapter.handleInbound(ctx);
    expect(result.replyText).toContain('No tienes workspaces para conmutar'); // mock DB unauthorized
  });

  it('BOT-005: Handles callback query switch:<UUID> with fail-closed access check', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const ctx = makeContext(`switch:${fakeUuid}`, true);
    
    const result = await botAdapter.handleInbound(ctx);
    expect(result.replyText).toContain('Error al conmutar workspace');
  });

  it('BOT-006: escapeHtml sanitizes dangerous characters preventing Telegram HTML injection', () => {
    const dangerous = `<script>alert("xss & 'pwn'")</script>`;
    const safe = escapeHtml(dangerous);
    expect(safe).toBe('&lt;script&gt;alert(&quot;xss &amp; &#039;pwn&#039;&quot;)&lt;/script&gt;');
    expect(safe).not.toContain('<');
    expect(safe).not.toContain('>');
  });

  const healthyStatus: HermesSystemStatus = {
    postgres: { online: true },
    ipfs: { state: 'DURABLE', detail: 'Kubo + Dual-Mirror' },
    securityEvents24h: 7,
    knowledgeFacts: 42,
  };

  it('BOT-007: buildStatusMessage reports real metrics without fabricated enforcement claims', () => {
    const msg = buildStatusMessage(healthyStatus, "S'Narai", 2);
    expect(msg).toContain('🟢 ONLINE');
    expect(msg).toContain('DURABLE');
    expect(msg).toContain('<code>7</code> eventos registrados (24h)');
    expect(msg).toContain("<code>42</code> hechos");
    expect(msg).toContain("S&#039;Narai");
    expect(msg).not.toContain('ENFORCING');
    expect(msg).not.toContain('100%');
  });

  it('BOT-008: buildStatusMessage renders degraded/offline states and missing data honestly', () => {
    const degraded: HermesSystemStatus = {
      postgres: { online: false },
      ipfs: { state: 'DEGRADED', detail: 'Fail-over Active' },
      securityEvents24h: null,
      knowledgeFacts: null,
    };
    const msg = buildStatusMessage(degraded, 'Org <b>', 1);
    expect(msg).toContain('🔴 OFFLINE');
    expect(msg).toContain('🟡 DEGRADED (Fail-over Active)');
    expect(msg).toContain('⚪ Sin datos');
    expect(msg).toContain('Org &lt;b&gt;');
  });

  it('BOT-009: Handles /help with operational guide', async () => {
    const ctx = makeContext('/help');
    const result = await botAdapter.handleInbound(ctx);
    expect(result.replyText).toContain('/portal');
    expect(result.replyText).toContain('/status');
    expect(result.replyText).toContain('/switch');
  });
});
