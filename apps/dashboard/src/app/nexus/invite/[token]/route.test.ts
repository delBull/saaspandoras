import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { db } from '@saasfly/db-core';
import * as crypto from 'crypto';

// Mock dependencies
vi.mock('@saasfly/db-core', () => {
  return {
    db: {
      query: {
        goldenLinks: {
          findFirst: vi.fn(),
        },
      },
      update: vi.fn(),
    },
    eq: vi.fn(),
    and: vi.fn(),
  };
});

vi.mock('@saasfly/db-core/schema', () => ({
  goldenLinks: {
    id: 'mock_id',
    slug: 'mock_slug',
    isActive: 'mock_isActive'
  }
}));

vi.mock('jose', () => ({
  SignJWT: vi.fn().mockImplementation(function() {
    return {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      setJti: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue('mock-jwt-token'),
    };
  }),
}));

describe('Commercial Hub Invite Resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (token: string) => {
    return new NextRequest(`http://localhost/nexus/invite/${token}`);
  };

  it('rejects missing or too short tokens', async () => {
    const req = createMockRequest('short');
    const res = await GET(req, { params: Promise.resolve({ token: 'short' }) } as any);
    expect(res.status).toBe(400);
  });

  it('rejects if invitation not found', async () => {
    (db.query.goldenLinks.findFirst as any).mockResolvedValue(null);
    const req = createMockRequest('valid_token_123');
    const res = await GET(req, { params: Promise.resolve({ token: 'valid_token_123' }) } as any);
    expect(res.status).toBe(404);
  });

  it('rejects if invitation is expired', async () => {
    (db.query.goldenLinks.findFirst as any).mockResolvedValue({
      id: 'mock-id',
      expiresAt: new Date(Date.now() - 10000), // Expired 10s ago
      metadata: { leadId: 'lead-123' }
    });
    
    const req = createMockRequest('valid_token_123');
    const res = await GET(req, { params: Promise.resolve({ token: 'valid_token_123' }) } as any);
    expect(res.status).toBe(410);
  });

  it('atomically consumes an active link and redirects to onboarding', async () => {
    (db.query.goldenLinks.findFirst as any).mockResolvedValue({
      id: 'mock-id',
      isActive: true,
      metadata: { leadId: 'lead-123' }
    });

    const mockUpdateSet = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();
    const mockReturning = vi.fn().mockResolvedValue([{ id: 'mock-id' }]); // Successfully consumed

    (db.update as any).mockReturnValue({
      set: mockUpdateSet,
      where: mockWhere,
      returning: mockReturning
    });

    const req = createMockRequest('valid_token_123');
    const res = await GET(req, { params: Promise.resolve({ token: 'valid_token_123' }) } as any);

    expect(db.update).toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/onboarding');
    expect(res.headers.get('set-cookie')).toContain('commercial_session=mock-jwt-token');
    expect(res.headers.get('set-cookie')).toContain('HttpOnly');
  });

  it('recovers session if consumed within 5 minutes', async () => {
    (db.query.goldenLinks.findFirst as any).mockResolvedValue({
      id: 'mock-id',
      isActive: false, // Already consumed
      metadata: { 
        leadId: 'lead-123',
        consumedAt: new Date(Date.now() - 2 * 60000).toISOString(), // Consumed 2 mins ago
        consumerJti: 'jti-123'
      }
    });

    const req = createMockRequest('valid_token_123');
    const res = await GET(req, { params: Promise.resolve({ token: 'valid_token_123' }) } as any);

    expect(db.update).not.toHaveBeenCalled(); // No double consumption
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/onboarding');
    expect(res.headers.get('set-cookie')).toContain('commercial_session=mock-jwt-token');
  });

  it('rejects recovery if consumed more than 5 minutes ago', async () => {
    (db.query.goldenLinks.findFirst as any).mockResolvedValue({
      id: 'mock-id',
      isActive: false, // Already consumed
      metadata: { 
        leadId: 'lead-123',
        consumedAt: new Date(Date.now() - 10 * 60000).toISOString(), // Consumed 10 mins ago
      }
    });

    const req = createMockRequest('valid_token_123');
    const res = await GET(req, { params: Promise.resolve({ token: 'valid_token_123' }) } as any);

    expect(res.status).toBe(410);
    expect(await res.text()).toBe('Invitation already consumed and recovery window expired');
  });
});
