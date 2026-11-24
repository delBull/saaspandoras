/**
 * 🏛️ HERMES OS — Multi-Channel Mesh & Clearance Router Tests (K27.6)
 * src/lib/@/channels/__tests__/channel-mesh.test.ts
 */

import { describe, it, expect } from 'vitest';
import { ChannelMeshService, CHANNEL_CONFIGS, effectiveCeiling } from '../channel-mesh';

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

  describe('MSH-010..013: Executive ceiling per channel (el jefe no tiene acceso ilimitado)', () => {
    it('MSH-010: WhatsApp sin privilegio ejecutivo sigue en PUBLIC', () => {
      expect(effectiveCeiling('WHATSAPP')).toBe('PUBLIC');

      const internal = CHANNEL_CONFIGS.WHATSAPP.maxClearanceCeiling;
      expect(internal).toBe('PUBLIC');
    });

    it('MSH-011: WhatsApp con privilegio ejecutivo sube a INTERNAL_OPERATIONAL pero no más', () => {
      expect(effectiveCeiling('WHATSAPP', true)).toBe('INTERNAL_OPERATIONAL');
    });

    it('MSH-012: el jefe NO recibe CONFIDENTIAL ni SECRET por WhatsApp', async () => {
      const operational = await ChannelMeshService.validateDisclosureClearance({
        channelType: 'WHATSAPP',
        requiredClearance: 'INTERNAL_OPERATIONAL',
        tenantId: 'pandoras',
        isExecutive: true,
      });
      expect(operational.allowed).toBe(true);

      const confidential = await ChannelMeshService.validateDisclosureClearance({
        channelType: 'WHATSAPP',
        requiredClearance: 'CONFIDENTIAL',
        tenantId: 'pandoras',
        isExecutive: true,
      });
      expect(confidential.allowed).toBe(false);
      expect(confidential.reason).toContain('Disclosure blocked');

      const secret = await ChannelMeshService.validateDisclosureClearance({
        channelType: 'WHATSAPP',
        requiredClearance: 'SECRET',
        tenantId: 'pandoras',
        isExecutive: true,
      });
      expect(secret.allowed).toBe(false);
    });

    it('MSH-013: los canales externos quedan en INTERNAL_OPERATIONAL y la consola interna en SECRET', () => {
      // Telegram es mensajería externa, igual que WhatsApp: contexto operativo, no confidencial.
      expect(effectiveCeiling('TELEGRAM', true)).toBe('INTERNAL_OPERATIONAL');
      // El portal del tenant no eleva por privilegio ejecutivo.
      expect(effectiveCeiling('PORTAL_AUTHENTICATED', true)).toBe('TENANT_RESTRICTED');
      // La consola interna autenticada sí conserva SECRET para el jefe.
      expect(effectiveCeiling('INTERNAL_DASHBOARD', true)).toBe('SECRET');
      expect(effectiveCeiling('INTERNAL_DASHBOARD')).toBe('CONFIDENTIAL');
    });
  });
});
