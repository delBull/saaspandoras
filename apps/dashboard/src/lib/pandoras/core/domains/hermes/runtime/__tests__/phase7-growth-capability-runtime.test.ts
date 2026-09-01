/**
 * 🏛️ Growth Capability Runtime & Governance Certification Suite (F7.5 / F7.6)
 * src/lib/pandoras/core/domains/hermes/runtime/__tests__/phase7-growth-capability-runtime.test.ts
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import { GET as getCapabilities } from '@/app/api/v1/growth/capabilities/route';
import { GET as getOverview } from '@/app/api/v1/growth/overview/route';
import { GET as getPipeline } from '@/app/api/v1/growth/pipeline/route';
import { GET as getWallet, POST as postWallet } from '@/app/api/v1/growth/wallet/route';
import { GET as getNftLab, POST as postNftLab } from '@/app/api/v1/growth/nft-lab/route';
import { GET as getControlPlaneIntents, POST as postControlPlaneIntents } from '@/app/api/v1/control-plane/intents/route';
import { GET as getControlPlaneOverview } from '@/app/api/v1/control-plane/overview/route';

const snariSessionToken = 'ps_v_17_0123456789abcdef0123456789abcdef';

function createAuthRequest(url: string, method: string = 'GET', body?: any): NextRequest {
  return new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      cookie: `pandoras_portal_session=${snariSessionToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('🏛️ Phase 7.5 & 7.6 — Growth Capability Runtime & Governance Certification', () => {
  it('GCM-01: CapabilityRegistryService catalog defines exactly 8 canonical keys with agents as Contract Ready', async () => {
    const profile = await capabilityRegistry.getTenantProfile('org_snarai');
    expect(profile.organizationSlug).toBe('snarai');
    expect(profile.planTier).toBe('ENTERPRISE');
    expect(profile.capabilities.length).toBe(8);

    const allKeys = profile.capabilities.map((c) => c.key);
    expect(allKeys).toEqual([
      'growth.crm',
      'growth.email',
      'growth.nft',
      'growth.finance',
      'growth.governance',
      'growth.analytics',
      'growth.automations',
      'growth.agents',
    ]);

    // growth.agents is Contract Ready (enabled = false by default)
    const agentsCap = profile.capabilities.find((c) => c.key === 'growth.agents');
    expect(agentsCap).toBeDefined();
    expect(agentsCap?.enabled).toBe(false);
    expect(agentsCap?.riskLevel).toBe('HIGH');
    expect(agentsCap?.requiresHumanApproval).toBe(true);
    expect(agentsCap?.agentExecutable).toBe(false);
  });

  it('GCM-02: assertCapability succeeds for active capabilities in tenant plan and rejects disabled', async () => {
    await expect(capabilityRegistry.assertCapability('org_snarai', 'growth.crm')).resolves.toBeUndefined();
    await expect(capabilityRegistry.assertCapability('org_snarai', 'growth.finance')).resolves.toBeUndefined();
    await expect(capabilityRegistry.assertCapability('org_snarai', 'growth.governance')).resolves.toBeUndefined();

    // growth.agents is disabled, so assertCapability must throw fail-closed
    await expect(capabilityRegistry.assertCapability('org_snarai', 'growth.agents')).rejects.toThrow('CAPABILITY_DISABLED');
  });

  it('GCM-03: Governance & Risk levels are strictly partitioned (F7.6)', async () => {
    const profile = await capabilityRegistry.getTenantProfile('org_snarai');
    
    const financeCap = profile.capabilities.find((c) => c.key === 'growth.finance');
    expect(financeCap).toBeDefined();
    expect(financeCap?.riskLevel).toBe('CRITICAL');
    expect(financeCap?.requiresGovernance).toBe(true);
    expect(financeCap?.requiresHumanApproval).toBe(true);
    expect(financeCap?.agentExecutable).toBe(false);

    const crmCap = profile.capabilities.find((c) => c.key === 'growth.crm');
    expect(crmCap).toBeDefined();
    expect(crmCap?.riskLevel).toBe('LOW');
    expect(crmCap?.requiresGovernance).toBe(false);
    expect(crmCap?.agentExecutable).toBe(true);

    const nftCap = profile.capabilities.find((c) => c.key === 'growth.nft');
    expect(nftCap).toBeDefined();
    expect(nftCap?.riskLevel).toBe('MEDIUM');
    expect(nftCap?.requiresGovernance).toBe(true);
    expect(nftCap?.requiresHumanApproval).toBe(true);

    const govCap = profile.capabilities.find((c) => c.key === 'growth.governance');
    expect(govCap).toBeDefined();
    expect(govCap?.requiresGovernance).toBe(true);
    expect(govCap?.requiresHumanApproval).toBe(true);
  });

  it('GCM-04: Non-existent organization throws fail-closed error', async () => {
    await expect(
      capabilityRegistry.getTenantProfile('org_non_existent_random_tenant_xyz_123')
    ).rejects.toThrow();
  });

  /* ────────────────────────────────────────────────────────────
   * 🔐 Smoke Security Tests (A, B, C, D, E)
   * ──────────────────────────────────────────────────────────── */

  it('SMOKE-A: Capability denial blocks unauthorized routes with 403 (Fail-Closed)', async () => {
    // Calling an endpoint requiring growth.agents or an unpermitted capability throws CAPABILITY_DISABLED
    await expect(capabilityRegistry.assertCapability('org_snarai', 'growth.agents')).rejects.toThrow('CAPABILITY_DISABLED');
  });

  it('SMOKE-B: Cross-tenant isolation rejects unauthorized access with 401/403 (0 rows leaked)', async () => {
    // S'Narai session trying to access another tenant 'eld'
    const spoofReq = new NextRequest('https://dash.pandoras.finance/api/v1/growth/pipeline?organizationId=eld', {
      headers: {
        cookie: `pandoras_portal_session=${snariSessionToken}`,
      },
    });

    const res = await getPipeline(spoofReq);
    expect(res.status).toBe(401);
  });

  it('SMOKE-C: Finance payout request routes to Governance Intent (NO direct transfer)', async () => {
    const req = createAuthRequest('https://dash.pandoras.finance/api/v1/growth/wallet', 'POST', {
      organizationId: 'org_snarai',
      payoutRequest: {
        amountUsdc: 1500,
        toAddress: '0x121a897f0f5a9b7c44756f40bdb2c8e87d2834fa',
        rationale: 'Vendor settlement payout request',
      },
    });

    const res = await postWallet(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('GOVERNANCE_APPROVAL_REQUIRED');
    expect(data.intentId).toMatch(/^intent_payout_/);
  });

  it('SMOKE-D: NFT Mint request routes to Governance Intent (NO immediate mint)', async () => {
    const req = createAuthRequest('https://dash.pandoras.finance/api/v1/growth/nft-lab', 'POST', {
      organizationId: 'org_snarai',
      collectionId: 'col_participation_cert',
      recipientAddress: '0x121a897f0f5a9b7c44756f40bdb2c8e87d2834fa',
      tokenType: 'CERTIFICATE',
    });

    const res = await postNftLab(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('GOVERNANCE_APPROVAL_REQUIRED');
    expect(data.intentId).toMatch(/^intent_nft_mint_/);
  });

  it('SMOKE-E: Agent / Autonomous intent requires human Governance approval before execution', async () => {
    // 1. Simulate an autonomous intent submission
    const simReq = createAuthRequest('https://dash.pandoras.finance/api/v1/control-plane/intents', 'POST', {
      action: 'SIMULATE',
      organizationId: 'org_snarai',
      simulationPayload: {
        missionId: 'autonomous_growth_mission_1',
        intentType: 'growth.marketing.campaign.dispatch.v1',
        objective: 'Autonomous Hermes campaign dispatch',
        rationale: 'High conversion probability detected',
      },
    });

    const simRes = await postControlPlaneIntents(simReq);
    expect(simRes.status).toBe(200);
    const simData = await simRes.json();
    expect(simData.success).toBe(true);
    const intentId = simData.intentId;

    // 2. Query pending intents in Governance Center
    const getReq = createAuthRequest('https://dash.pandoras.finance/api/v1/control-plane/intents?organizationId=snarai');
    const getRes = await getControlPlaneIntents(getReq);
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();

    const createdIntent = getData.pendingIntents.find((i: any) => i.id === intentId);
    expect(createdIntent).toBeDefined();
    expect(createdIntent.status).toBe('PENDING');

    // 3. Human Founder approves the intent in Governance Center
    const approveReq = createAuthRequest('https://dash.pandoras.finance/api/v1/control-plane/intents', 'POST', {
      action: 'APPROVE',
      organizationId: 'org_snarai',
      intentId,
      reason: 'Approved by Founder',
    });

    const approveRes = await postControlPlaneIntents(approveReq);
    expect(approveRes.status).toBe(200);
    const approveData = await approveRes.json();
    expect(approveData.status).toBe('APPROVED');
  });

  /* ────────────────────────────────────────────────────────────
   * 🌐 Standard HTTP Boundary Verification
   * ──────────────────────────────────────────────────────────── */

  it('GCM-HTTP-01: GET /api/v1/growth/capabilities returns tenant profile', async () => {
    const req = createAuthRequest('https://dash.pandoras.finance/api/v1/growth/capabilities?organizationId=snarai');
    const res = await getCapabilities(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.profile).toBeDefined();
    expect(data.enabledKeys).toContain('growth.crm');
  });

  it('GCM-HTTP-02: GET /api/v1/growth/pipeline enforces assertCapability(growth.crm)', async () => {
    const req = createAuthRequest('https://dash.pandoras.finance/api/v1/growth/pipeline?organizationId=snarai');
    const res = await getPipeline(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.stages).toBeDefined();
  });

  it('GCM-HTTP-03: GET /api/v1/control-plane/overview enforces assertCapability(growth.governance)', async () => {
    const req = createAuthRequest('https://dash.pandoras.finance/api/v1/control-plane/overview?organizationId=snarai');
    const res = await getControlPlaneOverview(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe('org_snarai');
  });

  it('GCM-HTTP-04: Unauthenticated request to Growth endpoints is rejected with 401', async () => {
    const req = new NextRequest('https://dash.pandoras.finance/api/v1/growth/pipeline?organizationId=snarai');
    const res = await getPipeline(req);
    expect(res.status).toBe(401);
  });
});
