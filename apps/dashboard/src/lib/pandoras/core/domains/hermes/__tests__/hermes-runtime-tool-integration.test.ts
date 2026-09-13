/**
 * 🏛️ Hermes OS — Runtime to Tool Gateway End-to-End Integration Suite
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/__tests__/hermes-runtime-tool-integration.test.ts
 *
 * Verifies the 4 Real Production Execution Paths:
 * Path 1: Runtime -> Gate -> Tool -> Provider (Web Intelligence / Extract)
 * Path 2: Runtime -> Gate -> Tool -> Provider (SEO Audit Engine)
 * Path 3: Production API Route -> Gate -> Tool -> Provider (Autonomous Research)
 * Path 4: Scheduled Cron Worker -> Tool -> IPFS Notarization Candidate
 * Path 5: Defense-in-Depth: Gate Blocks Unauthorized Tool Call at Runtime
 */

import { describe, it, expect } from '@jest/globals';
import { getDefaultRuntime, HermesRuntime } from '../runtime/hermes-runtime';

describe('🏛️ Hermes Runtime & Tool Gateway Production Integration Suite', () => {
  const runtime = getDefaultRuntime();

  // ── PATH 1: RUNTIME -> GATE -> TOOL -> PROVIDER (WEB EXTRACT) ──────────
  it('Path 1: Runtime dispatches web.extract with active capability through ToolAuthorizationGate', async () => {
    const htmlSample = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>S'Narai Beachfront Villas</title>
          <meta name="description" content="Luxury tokenized real estate in Puerto Escondido.">
        </head>
        <body>
          <h1>Invest in Paradise</h1>
          <p>Fractional ownership starting at $500 USD.</p>
          <a href="/whitepaper">Whitepaper</a>
        </body>
      </html>
    `;

    const response = await runtime.executeTool(
      {
        organizationId: 'snarai',
        actorId: 'admin_snarai',
        capabilityId: 'web.extract',
        toolName: 'web.extract',
        parameters: { html: htmlSample, url: 'https://snarai.com' },
      },
      [{ id: 'web.extract', description: 'Web Content Extraction' }]
    );

    expect(response.success).toBe(true);
    expect(response.unauthorized).toBeUndefined();
    const data = response.data as any;
    expect(data.title).toBe("S'Narai Beachfront Villas");
    expect(data.headings.h1).toContain('Invest in Paradise');
    expect(data.links).toContain('https://snarai.com/whitepaper');
  });

  // ── PATH 2: RUNTIME -> GATE -> TOOL -> PROVIDER (SEO AUDIT) ────────────
  it('Path 2: Runtime dispatches seo.audit with active capability, returning healthScore', async () => {
    const auditResponse = await runtime.executeTool(
      {
        organizationId: 'snarai',
        actorId: 'marketer_snarai',
        capabilityId: 'seo.audit',
        toolName: 'seo.audit',
        parameters: {
          url: 'https://snarai.com',
          html: `
            <html>
              <head><title>S'Narai Luxury</title><meta name="description" content="Villas"></head>
              <body><h1>Villa 1</h1><p>Description text for testing.</p></body>
            </html>
          `,
        },
      },
      [{ id: 'seo.audit', description: 'SEO Technical and Content Audit' }]
    );

    expect(auditResponse.success).toBe(true);
    const data = auditResponse.data as any;
    expect(data.healthScore).toBeGreaterThan(0);
    expect(data.issues).toBeDefined();
    expect(data.recommendations).toBeDefined();
  });

  // ── PATH 3: PRODUCTION API ROUTE -> GATE -> TOOL (AUTONOMOUS RESEARCH) ─
  it('Path 3: Dispatches research.run_mission generating deltas and candidate governance', async () => {
    const researchResponse = await runtime.executeTool(
      {
        organizationId: 'snarai',
        actorId: 'strategy_officer',
        capabilityId: 'research.run_mission',
        toolName: 'research.run_mission',
        parameters: {
          missionId: 'mission_test_e2e_01',
          tenantId: 'snarai',
          title: 'S\'Narai Competitor Intelligence',
          tenantUrl: 'https://snarai.com',
          competitorUrls: ['https://competitor-re.com'],
          targetKeywords: ['luxury', 'puerto escondido', 'rwa'],
          trigger: 'MANUAL',
        },
      },
      [{ id: 'research.run_mission', description: 'Autonomous Market Research' }]
    );

    expect(researchResponse.success).toBe(true);
    const report = researchResponse.data as any;
    expect(report.missionId).toBe('mission_test_e2e_01');
    expect(report.candidateGovernance).toBeDefined();
    expect(report.candidateGovernance.status).toBe('DISCOVERED');
    expect(report.candidateGovernance.requiresHumanApproval).toBe(true);
    expect(report.candidateGovernance.isDirectlyTrusted).toBe(false);
  });

  // ── PATH 4: CRON TRIGGER -> IPFS NOTARIZATION CANDIDATE ────────────────
  it('Path 4: Scheduled research mission with mock IPFS orchestrator anchors candidate CID', async () => {
    const mockIpfsVaultService = {
      ipfsOrchestrator: {
        pinContent: async (content: string, filename: string) => ({
          cid: 'mock_bafkrei_research_candidate_cid_123',
          IpfsHash: 'mock_bafkrei_research_candidate_cid_123',
          size: content.length,
        }),
      },
    };

    const cronResponse = await runtime.executeTool(
      {
        organizationId: 'snarai',
        actorId: 'cron_worker',
        capabilityId: 'research.run_mission',
        toolName: 'research.run_mission',
        parameters: {
          missionId: 'cron_e2e_02',
          tenantId: 'snarai',
          title: 'Scheduled S\'Narai Crawl',
          tenantUrl: 'https://snarai.com',
          competitorUrls: ['https://competitor-re.com'],
          targetKeywords: ['tokenization'],
          trigger: 'SCHEDULED_CRON',
          ipfsVaultService: mockIpfsVaultService,
        },
      },
      [{ id: 'research.run_mission', description: 'Autonomous Market Research' }]
    );

    expect(cronResponse.success).toBe(true);
    const report = cronResponse.data as any;
    expect(report.candidateCid).toBe('mock_bafkrei_research_candidate_cid_123');
    expect(report.candidateGovernance.requiresHumanApproval).toBe(true);
  });

  // ── PATH 5: GATE DEFENSE-IN-DEPTH -> REJECTS UNAUTHORIZED CAPABILITY ────
  it('Path 5: Runtime defense-in-depth rejects tool execution when tenant lacks capability', async () => {
    const response = await runtime.executeTool(
      {
        organizationId: 'snarai',
        actorId: 'unauthorized_user',
        capabilityId: 'web.browser',
        toolName: 'web.browser',
        parameters: { targetUrl: 'https://example.com' },
      },
      [{ id: 'web.extract', description: 'Only Extract Allowed' }]
    );

    expect(response.success).toBe(false);
    expect(response.unauthorized).toBe(true);
    expect(response.violationCode).toBe('UNAUTHORIZED_CAPABILITY');
  });
});
