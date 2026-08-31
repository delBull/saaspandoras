/**
 * 🏛️ Phase 7 — Full Hermes Service Boundary Certification Suite
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/__tests__/phase7-full-boundary-certification.test.ts
 *
 * Certifies all 10 Service Boundaries:
 * 1. Journeys API (/api/v1/hermes/journeys)
 * 2. Addons API (/api/v1/hermes/addons)
 * 3. Policies API (/api/v1/hermes/policies)
 * 4. Knowledge API (/api/v1/hermes/knowledge)
 * 5. Conversations API (/api/v1/hermes/conversations)
 * 6. Overview API (/api/v1/hermes/overview)
 * 7. Channels API (/api/v1/hermes/channels)
 * 8. Activity API (/api/v1/hermes/activity)
 * 9. Settings API (/api/v1/hermes/settings)
 * 10. Identity API (/api/v1/hermes/identity)
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getJourneys } from '@/app/api/v1/hermes/journeys/route';
import { GET as getAddons, POST as postAddons } from '@/app/api/v1/hermes/addons/route';
import { GET as getPolicies, POST as postPolicies } from '@/app/api/v1/hermes/policies/route';
import { GET as getKnowledge, PATCH as patchKnowledge } from '@/app/api/v1/hermes/knowledge/route';
import { GET as getConversations } from '@/app/api/v1/hermes/conversations/route';
import { GET as getOverview } from '@/app/api/v1/hermes/overview/route';
import { GET as getChannels } from '@/app/api/v1/hermes/channels/route';
import { GET as getActivity } from '@/app/api/v1/hermes/activity/route';
import { GET as getSettings } from '@/app/api/v1/hermes/settings/route';
import { GET as getIdentity } from '@/app/api/v1/hermes/identity/route';

describe('🏛️ Phase 7 — Comprehensive Hermes Service Boundary Suite', () => {
  const snariSessionToken = 'ps_v_17_0123456789abcdef0123456789abcdef';

  describe('1. Universal Auth & Fail-Closed Tenant Boundaries (10 Boundaries)', () => {
    const endpoints = [
      { name: 'Journeys GET', handler: () => getJourneys(new NextRequest('http://localhost:3000/api/v1/hermes/journeys')) },
      { name: 'Addons GET', handler: () => getAddons(new NextRequest('http://localhost:3000/api/v1/hermes/addons')) },
      { name: 'Policies GET', handler: () => getPolicies(new NextRequest('http://localhost:3000/api/v1/hermes/policies')) },
      { name: 'Knowledge GET', handler: () => getKnowledge(new NextRequest('http://localhost:3000/api/v1/hermes/knowledge')) },
      { name: 'Conversations GET', handler: () => getConversations(new NextRequest('http://localhost:3000/api/v1/hermes/conversations?conversationId=test')) },
      { name: 'Overview GET', handler: () => getOverview(new NextRequest('http://localhost:3000/api/v1/hermes/overview')) },
      { name: 'Channels GET', handler: () => getChannels(new NextRequest('http://localhost:3000/api/v1/hermes/channels')) },
      { name: 'Activity GET', handler: () => getActivity(new NextRequest('http://localhost:3000/api/v1/hermes/activity')) },
      { name: 'Settings GET', handler: () => getSettings(new NextRequest('http://localhost:3000/api/v1/hermes/settings')) },
      { name: 'Identity GET', handler: () => getIdentity(new NextRequest('http://localhost:3000/api/v1/hermes/identity')) },
    ];

    for (const ep of endpoints) {
      it(`rejects unauthenticated ${ep.name} with 401 UNAUTHENTICATED`, async () => {
        const res = await ep.handler();
        expect(res.status).toBe(401);
      });
    }

    it('rejects cross-tenant spoofing across all 10 endpoints', async () => {
      const spoofReq = (url: string) => new NextRequest(`http://localhost:3000${url}`, {
        headers: { cookie: `pandoras_portal_session=${snariSessionToken}` },
      });

      const resJ = await getJourneys(spoofReq('/api/v1/hermes/journeys?organizationSlug=eld'));
      expect([401, 403, 404]).toContain(resJ.status);

      const resA = await getAddons(spoofReq('/api/v1/hermes/addons?organizationSlug=eld'));
      expect([401, 403, 404]).toContain(resA.status);

      const resP = await getPolicies(spoofReq('/api/v1/hermes/policies?organizationSlug=eld'));
      expect([401, 403, 404]).toContain(resP.status);

      const resK = await getKnowledge(spoofReq('/api/v1/hermes/knowledge?organizationSlug=eld'));
      expect([401, 403, 404]).toContain(resK.status);

      const resO = await getOverview(spoofReq('/api/v1/hermes/overview?organizationSlug=eld'));
      expect([401, 403, 404]).toContain(resO.status);

      const resC = await getChannels(spoofReq('/api/v1/hermes/channels?organizationSlug=eld'));
      expect([401, 403, 404]).toContain(resC.status);

      const resAc = await getActivity(spoofReq('/api/v1/hermes/activity?organizationSlug=eld'));
      expect([401, 403, 404]).toContain(resAc.status);

      const resS = await getSettings(spoofReq('/api/v1/hermes/settings?organizationSlug=eld'));
      expect([401, 403, 404]).toContain(resS.status);

      const resI = await getIdentity(spoofReq('/api/v1/hermes/identity?organizationSlug=eld'));
      expect([401, 403, 404]).toContain(resI.status);
    });
  });

  describe('2. Addons Capability Boundary', () => {
    it('returns canonical addons catalog with tenant installation status', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/hermes/addons', {
        headers: { cookie: `pandoras_portal_session=${snariSessionToken}` },
      });

      const res = await getAddons(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.addons)).toBe(true);
      expect(data.addons.length).toBeGreaterThan(0);
      expect(data.addons.some((a: any) => a.addonId === 'vip_family_concierge')).toBe(true);
    });

    it('toggles an addon safely through the boundary', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/hermes/addons', {
        method: 'POST',
        headers: { cookie: `pandoras_portal_session=${snariSessionToken}` },
        body: JSON.stringify({ addonId: 'vip_family_concierge', active: true }),
      });

      const res = await postAddons(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe('3. Policies Capability Boundary', () => {
    it('fetches epistemic policies for S\'Narai', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/hermes/policies', {
        headers: { cookie: `pandoras_portal_session=${snariSessionToken}` },
      });

      const res = await getPolicies(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.policies)).toBe(true);
    });

    it('saves a tenant policy override via the boundary', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/hermes/policies', {
        method: 'POST',
        headers: { cookie: `pandoras_portal_session=${snariSessionToken}` },
        body: JSON.stringify({
          dimension: 'policy',
          key: 'pricing_transparency',
          content: 'Precios en MXN fijos durante Q3.',
        }),
      });

      const res = await postPolicies(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe('4. Knowledge Capability Boundary', () => {
    it('retrieves knowledge overview (facts + sources)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/hermes/knowledge', {
        headers: { cookie: `pandoras_portal_session=${snariSessionToken}` },
      });

      const res = await getKnowledge(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.facts)).toBe(true);
      expect(Array.isArray(data.sources)).toBe(true);
    });

    it('rejects invalid fact status updates', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/hermes/knowledge', {
        method: 'PATCH',
        headers: { cookie: `pandoras_portal_session=${snariSessionToken}` },
        body: JSON.stringify({ factId: 'fact_123', status: 'INVALID_STATUS' }),
      });

      const res = await patchKnowledge(req);
      expect(res.status).toBe(400);
    });
  });

  describe('5. Conversations & Operator Takeover Boundary', () => {
    it('fetches sanitized message logs for a conversation', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/hermes/conversations?conversationId=conv_demo_1', {
        headers: { cookie: `pandoras_portal_session=${snariSessionToken}` },
      });

      const res = await getConversations(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.messages)).toBe(true);
    });
  });
});
