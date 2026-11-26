/**
 * Instagram como canal conectable del tenant.
 *
 * Lo que se prueba:
 *  - la cuenta se guarda cifrada (igual que Telegram o Newsletter),
 *  - `metadata.igUserId` queda como dato de enrutamiento para el webhook,
 *  - no se acepta la conexión sin `igUserId` numérico y token,
 *  - el tenant es siempre el `canonicalOrgId` del llamador.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

let inserted: any = null;

vi.mock('@saasfly/db-core', () => ({
  db: {
    insert: () => ({
      values: async (row: any) => {
        inserted = row;
      },
    }),
    query: { tenantSocialIntegrations: { findFirst: async () => null } },
  },
  and: (...args: any[]) => args,
  eq: (...args: any[]) => args,
}));

vi.mock('@saasfly/db-core/schema', () => ({
  tenantSocialIntegrations: { id: 'id', tenantId: 'tenant_id' },
}));

vi.mock('../channel-vault.service', () => ({
  channelVaultAdapter: {
    encryptCredentials: vi.fn(async (orgId: string, integrationId: string, channel: string) => ({
      encryptedArtifact: { artifactId: `${channel}_${integrationId}`, orgId, payload: 'cifrado' },
      credentialFingerprint: 'fingerprint1234567',
    })),
  },
}));

import { tenantChannelService, CHANNEL_CATALOG } from '../tenant-channel.service';

const ORG = '9079ecf5-2162-4078-bddf-66b607e2d32f';

beforeEach(() => {
  inserted = null;
});

describe('catálogo de canales', () => {
  it('expone Instagram como canal de conexión directa', () => {
    const item = CHANNEL_CATALOG.find((channel) => channel.channel === 'instagram');
    expect(item).toBeDefined();
    expect(item?.connectionType).toBe('DIRECT_SECRET');
    expect(item?.defaultCapabilities).toEqual(expect.arrayContaining(['text', 'image']));
  });
});

describe('connectChannel(instagram)', () => {
  it('guarda la credencial cifrada y enruta por igUserId en metadata', async () => {
    const dto = await tenantChannelService.connectChannel(ORG, 'actor:test', {
      channel: 'instagram',
      accountName: "S'Narai · Instagram",
      accountHandle: '@snarai',
      credentials: {
        igUserId: '17841400000000001',
        accessToken: 'IGAA-token-largo-de-prueba',
        apiBase: 'https://graph.instagram.com/v21.0',
      },
      metadata: { igUserId: '999999999999' },
    });

    expect(dto.channel).toBe('instagram');
    expect(dto.status).toBe('CONNECTED');
    expect(inserted.tenantId).toBe(ORG);
    expect(inserted.encryptedPayload).toBeTruthy();
    // El metadata de enrutamiento sale de las credenciales, no del input:
    // un cliente no puede declarar que su cuenta es otra.
    expect(inserted.metadata.igUserId).toBe('17841400000000001');
    // La respuesta saneada nunca devuelve el secreto.
    expect(JSON.stringify(dto)).not.toContain('IGAA-token');
  });

  it('rechaza un igUserId no numérico', async () => {
    await expect(tenantChannelService.connectChannel(ORG, 'actor:test', {
      channel: 'instagram',
      accountName: 'x',
      accountHandle: '@x',
      credentials: { igUserId: 'snarai', accessToken: 'IGAA-token-largo-de-prueba' },
    })).rejects.toThrow(/igUserId/);
  });

  it('rechaza la conexión sin token', async () => {
    await expect(tenantChannelService.connectChannel(ORG, 'actor:test', {
      channel: 'instagram',
      accountName: 'x',
      accountHandle: '@x',
      credentials: { igUserId: '17841400000000001', accessToken: '' },
    })).rejects.toThrow(/accessToken/);
  });

  it('exige canonicalOrgId: el tenant no se toma del input', async () => {
    await expect(tenantChannelService.connectChannel('', 'actor:test', {
      channel: 'instagram',
      accountName: 'x',
      accountHandle: '@x',
      credentials: { igUserId: '17841400000000001', accessToken: 'IGAA-token-largo-de-prueba' },
    })).rejects.toThrow(/canonicalOrgId/);
  });
});
