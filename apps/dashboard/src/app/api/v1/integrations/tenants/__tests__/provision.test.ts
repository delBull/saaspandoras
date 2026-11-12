import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * POST /api/v1/integrations/tenants/provision
 *
 * Fallan si se deja de exigir auth/permiso/ownerEmail, si no se devuelve el
 * portalUrl, o si un slug tomado no responde 409.
 */

let keyPermissions: string[] = ['tenant.provision'];
let keyValid = true;
const provisionTenant = vi.fn();

vi.mock('@/lib/integrations/auth', () => ({
  IntegrationKeyService: {
    validateKey: async () => (keyValid ? { id: 'client_1', permissions: keyPermissions } : null),
  },
}));

vi.mock('@/lib/platform/tenant-provisioning', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/platform/tenant-provisioning')>();
  return { ...actual, provisionTenant: (...args: any[]) => provisionTenant(...(args as [any])) };
});

import { POST } from '../provision/route';
import { TenantProvisioningError } from '@/lib/platform/tenant-provisioning';

function req(body: unknown, headers: Record<string, string> = { authorization: 'Bearer sk_live_x' }) {
  return new Request('http://localhost/api/v1/integrations/tenants/provision', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const OK_RESULT = {
  projectId: 186,
  slug: 'forge',
  ownerEmail: 'mkt@forgeos.fitness',
  apiKey: 'sk_live_abc',
  keyFingerprint: 'sk_live_abc...',
  permissions: ['content.asset.read'],
  capabilities: ['Media.Image'],
  credits: { balanceUsd: 0, markupPercentage: 35 },
  portalUrl: '/portal/forge/media',
};

describe('POST /integrations/tenants/provision', () => {
  beforeEach(() => {
    keyValid = true;
    keyPermissions = ['tenant.provision'];
    provisionTenant.mockReset();
    provisionTenant.mockResolvedValue(OK_RESULT);
  });

  it('PROV-01: sin Authorization → 401', async () => {
    const res = await POST(req({ name: 'Forge', slug: 'forge', ownerEmail: 'a@b.com' }, {}));
    expect(res.status).toBe(401);
    expect(provisionTenant).not.toHaveBeenCalled();
  });

  it('PROV-02: key sin permiso tenant.provision → 403', async () => {
    keyPermissions = ['content.asset.read'];
    const res = await POST(req({ name: 'Forge', slug: 'forge', ownerEmail: 'a@b.com' }));
    expect(res.status).toBe(403);
    expect(provisionTenant).not.toHaveBeenCalled();
  });

  it('PROV-03: sin ownerEmail → 400 y NO se crea nada', async () => {
    const res = await POST(req({ name: 'Forge', slug: 'forge' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe('OWNER_EMAIL_REQUIRED');
    expect(provisionTenant).not.toHaveBeenCalled();
  });

  it('PROV-04: éxito → 201 con apiKey, portalUrl y pasos', async () => {
    const res = await POST(req({ name: 'Forge', slug: 'forge', ownerEmail: 'mkt@forgeos.fitness' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.apiKey).toBe('sk_live_abc');
    expect(body.portalUrl).toBe('/portal/forge/media');
    expect(body.next.step1).toContain('/portal/forge/media');
    expect(provisionTenant).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'forge', ownerEmail: 'mkt@forgeos.fitness' })
    );
  });

  it('PROV-05: slug tomado → 409 (mapea TenantProvisioningError)', async () => {
    provisionTenant.mockRejectedValue(
      new TenantProvisioningError('SLUG_TAKEN', 'El slug ya está en uso', 409)
    );

    const res = await POST(req({ name: 'Forge', slug: 'forge', ownerEmail: 'a@b.com' }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe('SLUG_TAKEN');
  });

  it('PROV-06: slug inválido → 400', async () => {
    provisionTenant.mockRejectedValue(
      new TenantProvisioningError('INVALID_SLUG', 'slug inválido', 400)
    );

    const res = await POST(req({ name: 'Forge', slug: 'x', ownerEmail: 'a@b.com' }));
    expect(res.status).toBe(400);
  });
});
