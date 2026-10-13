import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { db } from '@saasfly/db-core';

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: 'mock-jwt-token' })
  })
}));

// Mock jose
vi.mock('jose', () => ({
  jwtVerify: vi.fn().mockResolvedValue({
    payload: {
      scope: 'commercial:lead_read commercial:order_create',
      leadId: 'lead-123'
    }
  })
}));

// Mock TenantProvisioningService (vitest v4: `new` on mockImplementation factories
// does NOT honor returned objects like jest — real class via vi.hoisted)
const { mockProvisionTenant } = vi.hoisted(() => ({
  mockProvisionTenant: vi.fn().mockResolvedValue({
    success: true,
    organizationSlug: 'acme-inc',
  }),
}));

vi.mock('@saasfly/shared', () => {
  class MockTenantProvisioningService {
    provisionTenant = mockProvisionTenant;
  }
  const instance = new MockTenantProvisioningService();
  return {
    TenantProvisioningService: MockTenantProvisioningService,
    tenantProvisioningService: instance,
  };

});

// Mock DB
vi.mock('@saasfly/db-core', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
  eq: vi.fn()
}));

vi.mock('@saasfly/db-core/schema', () => ({
  commercialOrders: { id: 'id', leadId: 'lead_id' },
  commercialOrderLines: { orderId: 'order_id' },
  projects: { id: 'id', slug: 'slug' }
}));

describe('Commercial Order Provision Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PANDORAS_SECRET_KEY = 'test-secret-key';
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost/api/v1/internal/nexus/orders/order-123/provision', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  };

  const context = {
    params: Promise.resolve({ orderId: 'order-123' })
  };

  it('rejects missing wallet address with 400', async () => {
    const req = createRequest({});
    const res = await POST(req, context);
    expect(res.status).toBe(400);
    expect(await res.text()).toContain('Missing wallet address');
  });

  it('rejects unsettled order (PENDING_PAYMENT) with 402', async () => {
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 'order-123',
              leadId: 'lead-123',
              status: 'PENDING_PAYMENT',
              totalAmount: '299.00',
              requestedOrgName: 'Acme',
              requestedOrgSlug: 'acme',
            }
          ])
        })
      })
    });

    const req = createRequest({ walletAddress: '0x1234567890123456789012345678901234567890' });
    const res = await POST(req, context);
    expect(res.status).toBe(402);
    expect(await res.text()).toContain('Payment required');
  });

  it('rejects zero-cost auto-provision attempt even if marked with 400', async () => {
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 'order-123',
              leadId: 'lead-123',
              status: 'PAID',
              totalAmount: '0.00',
              requestedOrgName: 'Acme',
              requestedOrgSlug: 'acme',
            }
          ])
        })
      })
    });

    const req = createRequest({ walletAddress: '0x1234567890123456789012345678901234567890' });
    const res = await POST(req, context);
    expect(res.status).toBe(400);
    expect(await res.text()).toContain('zero-cost auto-provisioning is strictly prohibited');
  });

  it('bridges PAID order to PROVISIONING and completes to PROVISIONED', async () => {
    const mockOrderUpdate = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ id: 'order-123' }])
    });

    // 1. Load order
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 'order-123',
              leadId: 'lead-123',
              status: 'PAID',
              totalAmount: '299.00',
              requestedOrgName: 'Acme Inc',
              requestedOrgSlug: 'acme-inc',
            }
          ])
        })
      })
    });

    // 2. update to PROVISIONING
    (db.update as any).mockReturnValue({
      set: mockOrderUpdate
    });

    // 3. Load lines
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { productKey: 'GROWTH_OS', metadata: { plan: 'starter' } }
        ])
      })
    });

    // 4. Find project ID
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 42 }])
        })
      })
    });

    const req = createRequest({ walletAddress: '0x1234567890123456789012345678901234567890' });
    const res = await POST(req, context);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.organizationSlug).toBe('acme-inc');
    expect(mockProvisionTenant).toHaveBeenCalledTimes(1);
  });
});
