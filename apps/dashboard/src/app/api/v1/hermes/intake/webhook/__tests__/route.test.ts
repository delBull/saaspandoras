// @ts-ignore
const { mock } = await import('bun:test');

let mockValidateKeyResult: any = null;
let mockFindFirstResult: any = null;
let mockReturningLead: any = null;
let recordEntryCalls: any[] = [];
let handleNewLeadCalls: any[] = [];
let updateCalls: any[] = [];
let insertCalls: any[] = [];

mock.module('@/lib/integrations/auth', () => ({
  IntegrationKeyService: {
    validateKey: async (key: string) => mockValidateKeyResult,
  },
}));

mock.module('@/lib/admin/platform-audit-ledger.service', () => ({
  PlatformAuditLedgerService: {
    recordEntry: async (entry: any) => {
      recordEntryCalls.push(entry);
      return { id: 1, sequenceNumber: 1 };
    },
  },
}));

mock.module('@/lib/hermes/agents/HermesWhatsAppOrchestrator', () => ({
  HermesWhatsAppOrchestrator: {
    handleNewLeadIntake: async (id: string) => {
      handleNewLeadCalls.push(id);
    },
  },
}));

mock.module('@/db', () => ({
  db: {
    query: {
      marketingLeads: {
        findFirst: async () => mockFindFirstResult,
      },
    },
    insert: () => ({
      values: (val: any) => {
        insertCalls.push(val);
        return {
          returning: async () => [mockReturningLead],
        };
      },
    }),
    update: () => ({
      set: (val: any) => {
        updateCalls.push(val);
        return {
          where: async () => undefined,
        };
      },
    }),
  },
}));

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

describe('🛡️ F9.12 HTTP Integration: Hermes Universal Intake Webhook', () => {
  beforeEach(() => {
    mockValidateKeyResult = null;
    mockFindFirstResult = null;
    mockReturningLead = null;
    recordEntryCalls = [];
    handleNewLeadCalls = [];
    updateCalls = [];
    insertCalls = [];
  });

  // ── TEST 1: Missing API Key ──
  it('HTTP-01: Rejects with 401 when no API key is provided in header or body', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/hermes/intake/webhook', {
      method: 'POST',
      body: JSON.stringify({
        email: 'prospect@acme.corp',
        name: 'John Doe',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Missing API Key');
  });

  // ── TEST 2: Invalid API Key ──
  it('HTTP-02: Rejects with 401 when API Key is revoked or invalid in IntegrationKeyService', async () => {
    mockValidateKeyResult = null;

    const req = new NextRequest('http://localhost:3000/api/v1/hermes/intake/webhook', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer pk_live_invalid_key_12345',
      },
      body: JSON.stringify({
        email: 'prospect@acme.corp',
        name: 'John Doe',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toContain('Unauthorized. Invalid or revoked API Key');
  });

  // ── TEST 3: Valid Intake (New Lead) ──
  it('HTTP-03: Successfully creates new lead and dispatches audit + orchestrator when lead is new', async () => {
    mockValidateKeyResult = {
      id: 99,
      projectId: 1, // Pandora's HQ
      environment: 'production',
    };

    mockReturningLead = {
      id: 'lead-uuid-new-123',
      projectId: 1,
      email: 'founder@startup.io',
      name: 'Alice Founder',
      phoneNumber: '+521234567890',
    };

    mockFindFirstResult = null; // No lead with this identityHash exists yet

    const req = new NextRequest('http://localhost:3000/api/v1/hermes/intake/webhook', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer pk_live_valid_pandoras_key',
      },
      body: JSON.stringify({
        email: 'founder@startup.io',
        name: 'Alice Founder',
        phone: '+521234567890',
        company: 'Startup AI',
        source: 'Landing V2',
        campaignId: 'q3_outreach',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.leadId).toBe('lead-uuid-new-123');
    expect(json.deduplicated).toBe(false);

    // Verify insert happened
    expect(insertCalls.length).toBe(1);
    expect(insertCalls[0].email).toBe('founder@startup.io');
    expect(insertCalls[0].identityHash).toBeDefined();

    // Verify Platform Audit recorded LEAD_CAPTURED with integration capability
    expect(recordEntryCalls.length).toBe(1);
    expect(recordEntryCalls[0].action).toBe('LEAD_CAPTURED');
    expect(recordEntryCalls[0].capability).toBe('platform.integration.webhook.intake');

    // Verify Orchestrator was dispatched
    expect(handleNewLeadCalls).toContain('lead-uuid-new-123');
  });

  // ── TEST 4: Deduplication (Existing Lead) ──
  it('HTTP-04: Deduplicates lead when same email/phone is submitted, updating metadata without creating duplicate', async () => {
    mockValidateKeyResult = {
      id: 99,
      projectId: 2, // S'Narai
      environment: 'production',
    };

    // DB returns existing lead with matching identityHash
    mockFindFirstResult = {
      id: 'lead-uuid-existing-456',
      projectId: 2,
      email: 'investor@estate.mx',
      name: 'Bob Buyer',
      metadata: { originalSource: 'google_ads' },
    };

    const req = new NextRequest('http://localhost:3000/api/v1/hermes/intake/webhook', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer pk_live_snarai_key',
      },
      body: JSON.stringify({
        email: 'investor@estate.mx',
        phone: '+529988776655',
        company: 'Inversiones MX',
        notes: 'Segunda visita al portal',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.leadId).toBe('lead-uuid-existing-456');
    expect(json.deduplicated).toBe(true);

    // Invariant: db.insert must NOT be called when deduplicated
    expect(insertCalls.length).toBe(0);

    // Invariant: db.update must be called to merge metadata
    expect(updateCalls.length).toBe(1);

    // Verify Audit recorded LEAD_DEDUPLICATED
    expect(recordEntryCalls.length).toBe(1);
    expect(recordEntryCalls[0].action).toBe('LEAD_DEDUPLICATED');
    expect(recordEntryCalls[0].capability).toBe('hq.crm.enrich');
  });
});
