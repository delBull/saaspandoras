import { NextRequest } from 'next/server';
import { POST } from '../route';
import { db } from '@saasfly/db';
import { marketingLeads, goldenLinks, projects } from '@saasfly/db/schema';
import { IntegrationKeyService } from '@/lib/integrations/auth';
import { resolveNexusTmaSession } from '@/lib/nexus/nexus-tma-auth';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── MOCKS ─────────────────────────────────────────────────────────────────────

vi.mock('@saasfly/db', () => ({
  db: {
    query: {
      projects: {
        findFirst: vi.fn(),
      },
      marketingLeads: {
        findFirst: vi.fn(),
      }
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn(),
      }),
    }),
  }
}));

vi.mock('@/lib/integrations/auth', () => ({
  IntegrationKeyService: {
    validateKey: vi.fn(),
  }
}));

vi.mock('@/lib/nexus/nexus-tma-auth', () => ({
  resolveNexusTmaSession: vi.fn(),
}));

// ── HELPERS ───────────────────────────────────────────────────────────────────

function createRequest(authHeader: string | null, body: any): NextRequest {
  const req = new NextRequest('http://localhost:3000/api/v1/internal/nexus/leads/inject', {
    method: 'POST',
    headers: new Headers(authHeader ? { 'authorization': authHeader } : {}),
    body: JSON.stringify(body),
  });
  return req;
}

// ── TESTS ─────────────────────────────────────────────────────────────────────

describe('POST /api/v1/internal/nexus/leads/inject', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    name: 'Test Client',
    email: 'client@test.com',
    phoneNumber: '+123456789',
    idempotencyKey: 'idem-1234'
  };

  describe('Authentication & Authorization (Negative Tests)', () => {
    
    it('1. rejects valid integration token without required capability', async () => {
      (IntegrationKeyService.validateKey as any).mockResolvedValue({
        projectId: 1,
        permissions: ['read', 'deploy'] // Missing marketing.manage or growth.manage
      });

      (db.query.projects.findFirst as any).mockResolvedValue({ slug: 'pandoras' });

      const req = createRequest('Bearer pk_live_test123', validPayload);
      const res = await POST(req);
      
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toMatch(/Missing growth.manage capability/);
      expect(IntegrationKeyService.validateKey).toHaveBeenCalledWith('pk_live_test123');
    });

    it('2. rejects valid integration token assigned to wrong tenant', async () => {
      (IntegrationKeyService.validateKey as any).mockResolvedValue({
        projectId: 99,
        permissions: ['growth.manage'] 
      });

      // Resolves to a tenant that is NOT pandoras
      (db.query.projects.findFirst as any).mockResolvedValue({ slug: 'external-org' });

      const req = createRequest('Bearer pk_live_test123', validPayload);
      const res = await POST(req);
      
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toMatch(/Not authorized for this tenant/);
    });

    it('3. rejects TMA session from suspended/inactive collaborator', async () => {
      // resolveNexusTmaSession throws for inactive collaborators natively
      (resolveNexusTmaSession as any).mockRejectedValue(new Error('Nexus collaborator #1 is not ACTIVE'));

      const req = createRequest('Bearer tma some-init-data', validPayload);
      const res = await POST(req);
      
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toMatch(/not ACTIVE/);
    });

    it('4. ignores canonicalOrgId spoofing in JSON payload', async () => {
      (IntegrationKeyService.validateKey as any).mockResolvedValue({
        projectId: 1,
        permissions: ['growth.manage'] 
      });
      (db.query.projects.findFirst as any).mockResolvedValue({ slug: 'pandoras' });
      (db.query.marketingLeads.findFirst as any).mockResolvedValue(null);
      
      const insertMock = vi.fn().mockResolvedValue([{ id: 'new-lead-id' }]);
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({ returning: insertMock })
      });

      const req = createRequest('Bearer pk_live_test123', {
        ...validPayload,
        canonicalOrgId: 'hacker-org', // Attempt to spoof
        referrerId: 9999 // Attempt to spoof
      });
      const res = await POST(req);
      
      expect(res.status).toBe(200);
      
      // Verify db.insert was called with server-derived values, NOT spoofed values
      const insertValues = (db.insert as any).mock.results[0].value.values.mock.calls[0][0];
      expect(insertValues.metadata.canonicalOrgId).toBe('pandoras'); // Derived server-side
      expect(insertValues.referrer).toBe('system_service'); // Derived server-side (Service Token)
    });
  });

  describe('Deduplication & Concurrency (Negative Tests)', () => {
    
    it('5. returns 409 Conflict without leaking PII when lead already exists', async () => {
      (IntegrationKeyService.validateKey as any).mockResolvedValue({
        projectId: 1,
        permissions: ['growth.manage'] 
      });
      (db.query.projects.findFirst as any).mockResolvedValue({ slug: 'pandoras' });
      
      // Simulate existing lead
      (db.query.marketingLeads.findFirst as any).mockResolvedValue({
        id: 'existing-id',
        crmStage: 'PROPOSAL',
        name: 'Secret Client Name', // PII
        phone: '+123456789'
      });

      const req = createRequest('Bearer pk_live_test123', validPayload);
      const res = await POST(req);
      
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe('Lead already exists');
      expect(data.leadId).toBe('existing-id');
      expect(data.status).toBe('PROPOSAL');
      expect(data.name).toBeUndefined(); // DOES NOT LEAK PII
      expect(data.phone).toBeUndefined(); // DOES NOT LEAK PII
      
      // Ensure we didn't insert a duplicate
      expect(db.insert).not.toHaveBeenCalled();
    });
  });
});
