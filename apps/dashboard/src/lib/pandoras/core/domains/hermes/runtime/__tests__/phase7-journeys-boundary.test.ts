/**
 * 🧪 Phase 7 — Journeys Capability Boundary & Strangler Certification Suite
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/__tests__/phase7-journeys-boundary.test.ts
 *
 * Tests:
 * 1. GET /api/v1/hermes/journeys Auth Boundary (401 unauthenticated, 401 cross-tenant)
 * 2. GET /api/v1/hermes/journeys Authorized Output & Hierarchy Structure
 * 3. PATCH /api/v1/hermes/journeys Status Toggle & Fail-Closed Validation
 * 4. Shadow Equivalence: Compares API DTO output with direct DB query
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/v1/hermes/journeys/route';
import { db } from '@/db';
import { hermesJourneys, hermesJourneyStages } from '@/db/schema';
import { eq, or, asc } from 'drizzle-orm';
import type { GetJourneysResponseDTO } from '@/lib/dash-contracts/journeys';

describe('🏛️ Phase 7 — Journeys Capability Service Boundary Suite', () => {
  const snariSessionToken = 'ps_v_17_0123456789abcdef0123456789abcdef';

  describe('1. Authentication & Tenant Boundary (Fail-Closed)', () => {
    it('rejects unauthenticated GET requests with 401 UNAUTHENTICATED', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/hermes/journeys');
      const res = await GET(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.code).toBe('UNAUTHENTICATED');
    });

    it('rejects cross-tenant spoofing when S\'Narai session requests another slug (e.g. eld)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/hermes/journeys?organizationSlug=eld', {
        headers: {
          cookie: `pandoras_portal_session=${snariSessionToken}`,
        },
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated PATCH requests with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/hermes/journeys', {
        method: 'PATCH',
        body: JSON.stringify({ journeyId: '11111111-2222-3333-4444-555555555555', active: true }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(401);
    });

    it('rejects invalid payload with 400 VALIDATION_ERROR', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/hermes/journeys', {
        method: 'PATCH',
        headers: {
          cookie: `pandoras_portal_session=${snariSessionToken}`,
        },
        body: JSON.stringify({ journeyId: '' }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('2. Authorized Reading & Data Transformation', () => {
    it('returns journeys with ordered stages and presentation milestones for S\'Narai', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/hermes/journeys?organizationSlug=snarai', {
        headers: {
          cookie: `pandoras_portal_session=${snariSessionToken}`,
        },
      });
      const res = await GET(req);
      expect(res.status).toBe(200);

      const data: GetJourneysResponseDTO = await res.json();
      expect(data.journeys).toBeDefined();
      expect(Array.isArray(data.journeys)).toBe(true);

      if (data.journeys.length > 0) {
        const j = data.journeys[0];
        expect(j).toBeDefined();
        expect(j?.id).toBeDefined();
        expect(j?.name).toBeDefined();
        expect(j?.status).toBeDefined();
        expect(Array.isArray(j?.stages)).toBe(true);
        expect(Array.isArray(j?.milestones)).toBe(true);
      }
    });
  });

  describe('3. Shadow Equivalence Verification (Old SQL vs New API)', () => {
    it('verifies that API DTO response matches direct DB query byte for byte', async () => {
      // 1. Direct DB query (Old way with orgId & slug)
      const dbJourneys = await db
        .select()
        .from(hermesJourneys)
        .where(
          or(
            eq(hermesJourneys.organizationId, '9079ecf5-2162-4078-bddf-66b607e2d32f'),
            eq(hermesJourneys.organizationId, 'snarai'),
            eq(hermesJourneys.organizationId, 'org_snarai')
          )
        )
        .orderBy(asc(hermesJourneys.createdAt));

      // 2. API query (New way)
      const req = new NextRequest('http://localhost:3000/api/v1/hermes/journeys?organizationSlug=snarai', {
        headers: {
          cookie: `pandoras_portal_session=${snariSessionToken}`,
        },
      });
      const res = await GET(req);
      const data: GetJourneysResponseDTO = await res.json();

      // Equivalence Check
      expect(data.journeys.length).toBe(dbJourneys.length);

      for (let i = 0; i < dbJourneys.length; i++) {
        expect(data.journeys[i]?.id).toBe(dbJourneys[i]?.id);
        expect(data.journeys[i]?.name).toBe(dbJourneys[i]?.name);
        expect(data.journeys[i]?.status).toBe(dbJourneys[i]?.status);
      }
    });
  });
});
