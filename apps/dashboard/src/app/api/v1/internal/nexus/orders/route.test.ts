import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { db } from '@saasfly/db-core';
import * as crypto from 'crypto';

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

// Mock DB
vi.mock('@saasfly/db-core', () => ({
  db: {
    transaction: vi.fn()
  }
}));

describe('Commercial Orders API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PANDORAS_SECRET_KEY = 'test-secret-key';
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost/api/v1/internal/nexus/orders', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  };

  it('rejects invalid payload missing required fields', async () => {
    const req = createRequest({ requestedOrgName: 'Test' }); // Missing products
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects if token only has commercial:lead_read scope and lacks commercial:order_create', async () => {
    const { jwtVerify } = await import('jose');
    (jwtVerify as any).mockResolvedValueOnce({
      payload: {
        scope: 'commercial:lead_read',
        leadId: 'lead-123'
      }
    });

    const req = createRequest({
      requestedOrgName: 'Test Org',
      requestedOrgSlug: 'test-org',
      products: [{ productKey: 'GROWTH_OS' }]
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('rejects product not in server catalog (client cannot dictate arbitrary prices)', async () => {
    const req = createRequest({
      requestedOrgName: 'Test',
      requestedOrgSlug: 'test',
      products: [{ productKey: 'FAKE_PRODUCT', price: 10 }] // Fake product
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.text()).toContain('Invalid product');
  });

  it('successfully calculates total from catalog and calls db transaction', async () => {
    const mockTx = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onConflictDoNothing: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'order-123' }])
    };
    
    (db.transaction as any).mockImplementation(async (callback: any) => {
      return callback(mockTx);
    });

    const req = createRequest({
      requestedOrgName: 'Test Org',
      requestedOrgSlug: 'test-org',
      products: [
        { productKey: 'GROWTH_OS', metadata: { intent: 'test' } },
        { productKey: 'HERMES' }
      ]
    });
    
    const res = await POST(req);
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.orderId).toBe('order-123');
    
    // Growth OS deduplicates with Hermes (Registry key 'HERMES'). Starter plan price = 299.
    // Check what was passed to insert commercialOrders values
    const orderValuesCall = mockTx.values.mock.calls[0]?.[0] as any;
    expect(orderValuesCall.totalAmount).toBe('299');
    expect(orderValuesCall.leadId).toBe('lead-123');
    expect(orderValuesCall.status).toBe('PENDING_PAYMENT');
  });
  
  it('returns 409 if active order already exists (unique partial index violation)', async () => {
    (db.transaction as any).mockRejectedValue({
      code: '23505',
      constraint: 'commercial_orders_active_idx'
    });

    const req = createRequest({
      requestedOrgName: 'Test Org',
      requestedOrgSlug: 'test-org',
      products: [{ productKey: 'GROWTH_OS' }]
    });
    
    const res = await POST(req);
    expect(res.status).toBe(409);
    expect(await res.text()).toContain('active order');
  });
});
