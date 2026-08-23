/**
 * 🏛️ HERMES OS — Multi-Channel Mesh & Clearance Router Tests (K27.6)
 * src/lib/pandoras/core/domains/hermes/channels/__tests__/channel-mesh.test.ts
 */

import { describe, it, expect } from 'vitest';
import { ChannelMeshService, CHANNEL_CONFIGS } from '../channel-mesh';

describe('Hermes OS Milestone K27.6 — Multi-Channel Mesh & Clearance Routing', () => {
  it('MSH-001: Allows PUBLIC knowledge disclosure across all channels', async () => {
    const telegramRes = await ChannelMeshService.validateDisclosureClearance({
      channelType: 'TELEGRAM',
      requiredClearance: 'PUBLIC',
      tenantId: 'snarai',
    });
    expect(telegramRes.allowed).toBe(true);

    const webRes = await ChannelMeshService.validateDisclosureClearance({
      channelType: 'WEB_WIDGET',
      requiredClearance: 'PUBLIC',
      tenantId: 'snarai',
    });
    expect(webRes.allowed).toBe(true);
  });

  it('MSH-002: HARD BLOCK on TENANT_RESTRICTED or SECRET knowledge over public channels (Telegram, WhatsApp)', async () => {
    const restrictedOverTelegram = await ChannelMeshService.validateDisclosureClearance({
      channelType: 'TELEGRAM',
      requiredClearance: 'TENANT_RESTRICTED',
      tenantId: 'snarai',
      artifactId: 'investor_private_terms',
    });

    expect(restrictedOverTelegram.allowed).toBe(false);
    expect(restrictedOverTelegram.reason).toContain('Disclosure blocked');

    const secretOverWhatsapp = await ChannelMeshService.validateDisclosureClearance({
      channelType: 'WHATSAPP',
      requiredClearance: 'SECRET',
      tenantId: 'snarai',
      artifactId: 'corp_tax_secret',
    });

    expect(secretOverWhatsapp.allowed).toBe(false);
  });

  it('MSH-003: Allows TENANT_RESTRICTED disclosure on authenticated portals and REST APIs', async () => {
    const portalRes = await ChannelMeshService.validateDisclosureClearance({
      channelType: 'PORTAL_AUTHENTICATED',
      requiredClearance: 'TENANT_RESTRICTED',
      tenantId: 'snarai',
    });
    expect(portalRes.allowed).toBe(true);

    const apiRes = await ChannelMeshService.validateDisclosureClearance({
      channelType: 'REST_API',
      requiredClearance: 'TENANT_RESTRICTED',
      tenantId: 'snarai',
    });
    expect(apiRes.allowed).toBe(true);
  });

  it('MSH-004: Confirms clearance ceilings per channel configuration', () => {
    expect(ChannelMeshService.getMaxClearance('TELEGRAM')).toBe('PUBLIC');
    expect(ChannelMeshService.getMaxClearance('PORTAL_AUTHENTICATED')).toBe('TENANT_RESTRICTED');
    expect(ChannelMeshService.getMaxClearance('INTERNAL_DASHBOARD')).toBe('CONFIDENTIAL');
  });
});
