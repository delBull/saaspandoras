// @ts-ignore
const { mock } = await import('bun:test');

let capturedAuditEvents: any[] = [];
let dbMarketingLeads = new Map<string, any>();
let dbHermesKnowledge: any[] = [];
let signalWireSendCalls: any[] = [];
let metaFetchCalls: any[] = [];
let currentTargetProjectId = 1;

mock.module('@/lib/integrations/signalwire-service', () => ({
  SignalWireService: {
    sendSMS: async (payload: any) => {
      signalWireSendCalls.push(payload);
      return { success: true, sid: `SM_sw_${Date.now()}` };
    },
  },
}));

let currentLedgerHash = '0000000000000000000000000000000000000000000000000000000000000000';
mock.module('@/lib/admin/platform-audit-ledger.service', () => ({
  PlatformAuditLedgerService: {
    recordEntry: (entry: any) => {
      const prevHash = currentLedgerHash;
      const currentHash = `hash_${capturedAuditEvents.length + 1}`;
      currentLedgerHash = currentHash;
      capturedAuditEvents.push({ ...entry, prevHash, currentHash, sequenceNumber: capturedAuditEvents.length + 1 });
      return { id: 1, sequenceNumber: capturedAuditEvents.length, prevHash, currentHash, ...entry };
    },
    resetForTesting: () => {
      capturedAuditEvents = [];
      currentLedgerHash = '0000000000000000000000000000000000000000000000000000000000000000';
    },
    verifyChainIntegrity: () => ({ valid: true }),
  },
}));

mock.module('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [
            currentTargetProjectId === 2
              ? {
                  id: 2,
                  slug: 'snarai',
                  organizationId: 'org_snarai',
                  title: "S'Narai Residences",
                  tokenPriceUsd: '250.00',
                  fiduciaryEntity: 'Snarai Trust',
                  status: 'ACTIVE',
                }
              : {
                  id: 1,
                  slug: 'pandoras',
                  organizationId: 'org_1',
                  title: "Pandora's Growth OS",
                  tokenPriceUsd: '1.00',
                  fiduciaryEntity: 'Pandoras Trust',
                  status: 'ACTIVE',
                },
          ],
        }),
      }),
    }),
    query: {
      marketingLeads: {
        findFirst: async () => {
          return currentTargetProjectId === 2
            ? dbMarketingLeads.get('lead_snarai_tenant_002')
            : dbMarketingLeads.get('lead_pandoras_hq_001');
        },
      },
      hermesKnowledge: {
        findMany: async () => dbHermesKnowledge,
      },
      projects: {
        findFirst: async () => (
          currentTargetProjectId === 2
            ? { id: 2, slug: 'snarai', organizationId: 'org_snarai', title: "S'Narai Residences", status: 'ACTIVE' }
            : { id: 1, slug: 'pandoras', organizationId: 'org_1', title: "Pandora's Growth OS", status: 'ACTIVE' }
        ),
      },
    },
    update: () => ({
      set: (val: any) => ({
        where: async () => {
          for (const [id, lead] of dbMarketingLeads.entries()) {
            dbMarketingLeads.set(id, { ...lead, ...val });
          }
        },
      }),
    }),
  },
}));

// Mock global fetch for Meta WhatsApp Graph API
const originalFetch = global.fetch;
global.fetch = async (url: any, options: any) => {
  if (typeof url === 'string' && url.includes('graph.facebook.com')) {
    metaFetchCalls.push({ url, options });
    return new Response(
      JSON.stringify({
        messaging_product: 'whatsapp',
        contacts: [{ wa_id: '521234567890' }],
        messages: [{ id: 'wamid.HBgLMTIzNDU2Nzg5MBUCABEYE' }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return originalFetch(url, options);
};

import { describe, it, expect, beforeEach } from 'vitest';
import { HermesOutboundDispatcher } from '@/lib/hermes/agents/HermesOutboundDispatcher';
import { WhatsAppProviderResolver, MetaWhatsAppProvider, SignalWireWhatsAppProvider } from '@/lib/channels/whatsapp/whatsapp-provider';

describe('🏛️ F9.12 End-to-End Proof: Hermes Universal Intake → Knowledge → Kernel → Channel Adapter → Audit', () => {
  beforeEach(() => {
    capturedAuditEvents = [];
    dbMarketingLeads.clear();
    dbHermesKnowledge = [];
    signalWireSendCalls = [];
    metaFetchCalls = [];
    currentTargetProjectId = 1;
  });

  // ── TEST 1: CHANNEL RESOLUTION INVARIANT ──
  it('E2E-01: WhatsAppProviderResolver routes HQ to Meta and Tenants to SignalWire', () => {
    // Set dummy envs so Meta provider considers credentials present
    process.env.WHATSAPP_ACCESS_TOKEN = 'mock_meta_token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '10987654321';

    // Pandora's HQ (org_1) resolves to Meta WhatsApp
    const hqProvider = WhatsAppProviderResolver.getProviderForTenant('org_1');
    expect(hqProvider).toBeInstanceOf(MetaWhatsAppProvider);

    // Tenant (e.g. S'Narai org_2) resolves to SignalWire telephony adapter
    const tenantProvider = WhatsAppProviderResolver.getProviderForTenant('org_2');
    expect(tenantProvider).toBeInstanceOf(SignalWireWhatsAppProvider);
  });

  // ── TEST 2: FULL COGNITIVE TURN & DISPATCH (PANDORA HQ -> META) ──
  it('E2E-02: End-to-end Hermes turn: Ingest lead → RAG Knowledge → Hermes Runtime → Meta Dispatch → Audit', async () => {
    currentTargetProjectId = 1;
    process.env.WHATSAPP_ACCESS_TOKEN = 'mock_meta_token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '10987654321';

    const testLeadId = 'lead_pandoras_hq_001';
    dbMarketingLeads.set(testLeadId, {
      id: testLeadId,
      projectId: 1, // Pandora's HQ
      name: 'Carlos Slim',
      phoneNumber: '+525511223344',
      email: 'carlos@inbursa.com',
      source: 'Institutional Landing',
      contactContext: {},
    });

    // Populate real tenant knowledge
    dbHermesKnowledge = [
      {
        id: 'k_01',
        organizationId: 'org_1',
        dimension: 'identity',
        key: 'overview',
        content: 'Pandoras ofrece infraestructura de tokenizacion RWA institucional y agentes Hermes.',
        status: 'ACTIVE',
      },
    ];

    // Execute Outbound Dispatcher (which invokes real HermesRuntime + Meta WhatsApp)
    const result = await HermesOutboundDispatcher.handleNewLeadIntake(testLeadId);

    expect(result.success).toBe(true);
    expect(result.provider).toBe('meta');
    expect(result.channelMessageId).toBe('wamid.HBgLMTIzNDU2Nzg5MBUCABEYE');
    expect(result.messageContent).toBeDefined();

    // Verify Meta API was called via Graph API
    expect(metaFetchCalls.length).toBe(1);
    expect(metaFetchCalls[0].url).toContain('graph.facebook.com');

    // Verify Platform Audit Ledger recorded the outreach event with AGENT_DELEGATE
    const outreachAudit = capturedAuditEvents.find(
      (e) => e.action === 'HERMES_OUTREACH_INITIATED' && e.resourceId === testLeadId
    );
    expect(outreachAudit).toBeDefined();
    expect(outreachAudit.actorType).toBe('AGENT_DELEGATE');
    expect(outreachAudit.capability).toBe('hq.crm.outreach');
    expect(outreachAudit.result).toBe('SUCCESS');

    // Verify DB lead contactContext was updated with trace
    const updatedLead = dbMarketingLeads.get(testLeadId);
    expect(updatedLead.contactContext.outreachStatus).toBe('DISPATCHED');
    expect(updatedLead.contactContext.channelProvider).toBe('meta');
    expect(updatedLead.contactContext.providerMessageId).toBe('wamid.HBgLMTIzNDU2Nzg5MBUCABEYE');
  });

  // ── TEST 3: FULL COGNITIVE TURN & DISPATCH (TENANT -> SIGNALWIRE) ──
  it('E2E-03: Tenant turn: Ingest lead → Hermes Runtime → SignalWire Dispatch → Audit', async () => {
    currentTargetProjectId = 2;
    const testLeadId = 'lead_snarai_tenant_002';
    dbMarketingLeads.set(testLeadId, {
      id: testLeadId,
      projectId: 2, // S'Narai Tenant
      name: 'Mariana Gomez',
      phoneNumber: '+529988776655',
      email: 'mariana@realestate.mx',
      source: 'S Narai Portal',
      contactContext: {},
    });

    // Execute Outbound Dispatcher (routes to SignalWire for org_2)
    const result = await HermesOutboundDispatcher.handleNewLeadIntake(testLeadId);

    expect(result.success).toBe(true);
    expect(result.provider).toBe('signalwire');
    expect(result.channelMessageId).toBeDefined();

    // Verify SignalWire was dispatched
    expect(signalWireSendCalls.length).toBe(1);
    expect(signalWireSendCalls[0].to).toBe('+529988776655');

    // Verify Audit
    const outreachAudit = capturedAuditEvents.find(
      (e) => e.action === 'HERMES_OUTREACH_INITIATED' && e.resourceId === testLeadId
    );
    expect(outreachAudit).toBeDefined();
    expect(outreachAudit.capability).toBe('tenant.hermes.outreach');
    expect(outreachAudit.stateTransition.newState.provider).toBe('signalwire');
  });
});
