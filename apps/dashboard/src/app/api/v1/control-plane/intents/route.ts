/**
 * 🛰️ Control Plane API Boundary — Intents Service
 * /api/v1/control-plane/intents
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { operationalIntents, operationalApprovals } from '@saasfly/db/schema';
import { eq, desc, or } from "@saasfly/db-core";
import { getAuth } from '@saasfly/auth-sdk';
import { checkRateLimit, clientIpFromHeaders } from '@saasfly/hermes-core';
import { validatePortalSession } from '@saasfly/shared';
import { OrganizationSDK } from '@saasfly/shared';
import { SessionTokenService } from '@saasfly/hermes-core';
import { isWalletAuthorizedForTenant } from '@saasfly/hermes-core';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import type { 
  OperationalIntentDTO, 
  GetPendingIntentsResponseDTO 
} from '@saasfly/shared';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

async function resolveControlPlaneTenant(req: NextRequest, requestedOrg?: string | null): Promise<{
  organizationId: string;
  organizationSlug: string;
  projectId?: number;
} | null> {
  const cleanSlug = requestedOrg ? requestedOrg.replace(/^org_/, '').trim() : '';
  if (!cleanSlug) return null;

  // 1. Portal Session Cookie
  const portalCookie = req.cookies.get('pandoras_portal_session')?.value;
  if (portalCookie) {
    const session = await validatePortalSession(portalCookie);
    if (session) {
      const org = await OrganizationSDK.resolve(session.projectId, session.product as any);
      if (org) {
        if (cleanSlug !== org.slug && cleanSlug !== org.organizationId) {
          return null;
        }
        return {
          organizationId: org.organizationId,
          organizationSlug: org.slug,
          projectId: session.projectId,
        };
      }
    }
  }

  // 2. Web Wallet Session (Anti-IDOR)
  const auth = await getAuth();
  if (auth.isVerified && auth.session?.address) {
    const isAuth = await isWalletAuthorizedForTenant(auth.session.address, cleanSlug);
    if (!isAuth) return null;
    return {
      organizationId: requestedOrg || `org_${cleanSlug}`,
      organizationSlug: cleanSlug,
    };
  }

  // 3. Bearer token
  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (bearerToken) {
    try {
      const payload = sessionTokenService.verifyToken(bearerToken);
      const tenant = payload.organizationId.toLowerCase().replace(/^org_/, '');
      if (cleanSlug !== tenant && cleanSlug !== payload.organizationId) {
        return null;
      }
      return {
        organizationId: payload.organizationId,
        organizationSlug: tenant,
      };
    } catch {
      return null;
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`cp-intents-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const orgParam = searchParams.get('organizationId') || '';
    const cleanSlug = orgParam.replace(/^org_/, '').trim();

    const auth = await resolveControlPlaneTenant(req, orgParam);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Session or wallet authentication required.' }, { status: 401 });
    }

    // 🔒 Capability Assertion Enforcement (Fail-Closed)
    try {
      await capabilityRegistry.assertCapability(auth.organizationId, 'growth.governance');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    const rows = await db
      .select()
      .from(operationalIntents)
      .where(
        or(
          eq(operationalIntents.organizationId, orgParam),
          eq(operationalIntents.organizationId, `org_${cleanSlug}`),
          eq(operationalIntents.organizationId, cleanSlug),
          eq(operationalIntents.organizationId, auth.organizationId)
        )
      )
      .orderBy(desc(operationalIntents.createdAt));

    const pendingIntents: OperationalIntentDTO[] = rows.map((r) => ({
      id: r.id,
      intentId: r.id,
      organizationId: r.organizationId,
      missionId: r.missionId,
      missionName: r.objective || 'Operational Intent Mission',
      strategyDecision: r.rationale || 'Autonomous Recommendation',
      reasonSummary: r.rationale || '',
      intentType: r.intentType,
      objective: r.objective,
      rationale: r.rationale || '',
      pack: r.packId || 'core_marketing_pack',
      budget: undefined,
      authorityRequired: 'Founder Approval',
      consequence: `Execution of ${r.intentType}`,
      status: (r.status === 'approved' ? 'APPROVED' : r.status === 'rejected' ? 'REJECTED' : 'PENDING') as any,
      riskScore: 10,
      decisionReason: null,
      createdAt: r.createdAt.toISOString(),
    }));

    const response: GetPendingIntentsResponseDTO = { pendingIntents };
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[ControlPlane API: intents GET] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`cp-intents-post:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const body = await req.json();
    const { action, organizationId, intentId, reason, simulationPayload } = body;

    const auth = await resolveControlPlaneTenant(req, organizationId);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Session or wallet authentication required.' }, { status: 401 });
    }

    // 🔒 Capability Assertion Enforcement (Fail-Closed)
    try {
      await capabilityRegistry.assertCapability(auth.organizationId, 'growth.governance');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    if (action === 'SIMULATE') {
      const missionId = simulationPayload?.missionId || 'mission_demo_1';
      const cleanOrgId = auth.organizationId;
      const generatedId = `intent_${Date.now()}`;

      const inserted = await db
        .insert(operationalIntents)
        .values({
          id: generatedId,
          organizationId: cleanOrgId,
          missionId,
          packId: 'core_marketing_pack',
          packVersion: '1.0.0',
          strategyDecisionId: 'decision_sim_1',
          intentType: simulationPayload?.intentType || 'hermes.governance.intervention.v1',
          objective: simulationPayload?.objective || 'Simulated Hermes Autonomous Operational Intent',
          rationale: simulationPayload?.rationale || 'Triggered via founder control panel testing',
          status: 'proposed',
        })
        .returning();

      return NextResponse.json({ success: true, intentId: inserted[0]?.id || generatedId });
    }

    if (!intentId) {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'intentId is required' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      // 1. Fetch the intent to determine type and payload
      const [intentRow] = await db
        .select()
        .from(operationalIntents)
        .where(eq(operationalIntents.id, intentId))
        .limit(1);

      if (!intentRow) {
        return NextResponse.json({ code: 'NOT_FOUND', message: 'Intent not found.' }, { status: 404 });
      }

      // 2. Tenant isolation: verify intent belongs to the authenticated org
      const normalizedIntentOrg = intentRow.organizationId.replace(/^org_/, '').toLowerCase();
      const normalizedAuthOrg = auth.organizationId.replace(/^org_/, '').toLowerCase();
      if (normalizedIntentOrg !== normalizedAuthOrg) {
        console.log('DEBUG MISMATCH:', { intentOrg: intentRow.organizationId, authOrg: auth.organizationId, normalizedIntentOrg, normalizedAuthOrg });
        return NextResponse.json({ code: 'FORBIDDEN', message: 'Intent does not belong to this organization.' }, { status: 403 });
      }

      // ── H2 Replay Protection ─────────────────────────────────────────────
      // If intent was already approved or executed, return early without re-dispatching executor.
      // Prevents double-mint / double-deploy on duplicate APPROVE calls.
      if (intentRow.status === 'approved' || intentRow.status === 'executed') {
        return NextResponse.json({
          success: true,
          intentId,
          status: intentRow.status.toUpperCase(),
          alreadyProcessed: true,
          message: `Intent already in status '${intentRow.status}'. No action taken.`,
        });
      }

      await db
        .update(operationalIntents)
        .set({
          status: 'approved',
          updatedAt: new Date(),
        })
        .where(eq(operationalIntents.id, intentId));

      await db.insert(operationalApprovals).values({
        intentId,
        actorId: 'founder',
        decision: 'approved',
        reason: reason || 'Approved via Control Plane API',
      });

      // 3. Post-approval executor dispatch — type-specific execution
      // Each intentType has exactly one executor. Unknown types return APPROVED without execution.

      // ── growth.nft.collection.v1 → on-chain contract deployment ──────────
      if (intentRow.intentType === 'growth.nft.collection.v1') {
        setImmediate(async () => {
          try {
            const { executeNftCollectionDeploy } = await import('@saasfly/nexus-deals-sdk');
            await executeNftCollectionDeploy(intentId, intentRow.organizationId);
          } catch (execErr: any) {
            console.error(`[IntentsAPI] NFT deploy executor failed for intent ${intentId}:`, execErr?.message);
            // Failure is logged; collection status reverts to GOVERNANCE_PENDING in executor
          }
        });
        return NextResponse.json({ success: true, intentId, status: 'APPROVED', executorDispatched: true });
      }

      // ── growth.nft.mint.v1 → on-chain token mint ─────────────────────────
      // Triggered by: REQUIRE_GOVERNANCE path in NftCapability.issueToken()
      // Executor resolves issuanceId from intent rationale → calls mintTo on deployed contract
      if (intentRow.intentType === 'growth.nft.mint.v1') {
        setImmediate(async () => {
          try {
            const { resolveIssuanceIdFromIntent, executeNftMint } = await import('@saasfly/nexus-deals-sdk');
            const issuanceId = await resolveIssuanceIdFromIntent(intentId);
            if (!issuanceId) {
              console.error(`[IntentsAPI] NFT mint executor: cannot resolve issuanceId from intent ${intentId}`);
              return;
            }
            await executeNftMint(issuanceId, intentRow.organizationId);
          } catch (execErr: any) {
            console.error(`[IntentsAPI] NFT mint executor failed for intent ${intentId}:`, execErr?.message);
            // Failure is logged; issuance status set to 'mint_failed' in executor
          }
        });
        return NextResponse.json({ success: true, intentId, status: 'APPROVED', executorDispatched: true });
      }

      // ── growth.nft.revoke.v1 → on-chain token revocation ─────────────────
      // Triggered by: NftCapability.revokeToken() — always requires governance
      // Executor resolves issuanceId from intent objective → calls burn/revoke on contract
      if (intentRow.intentType === 'growth.nft.revoke.v1') {
        setImmediate(async () => {
          try {
            const { executeNftRevoke } = await import('@saasfly/nexus-deals-sdk');
            await executeNftRevoke(intentId, intentRow.organizationId);
          } catch (execErr: any) {
            console.error(`[IntentsAPI] NFT revoke executor failed for intent ${intentId}:`, execErr?.message);
            // Failure is logged; token.revoke_failed outbox emitted in executor
          }
        });
        return NextResponse.json({ success: true, intentId, status: 'APPROVED', executorDispatched: true });
      }

      return NextResponse.json({ success: true, intentId, status: 'APPROVED' });
    }

    if (action === 'REJECT') {
      await db
        .update(operationalIntents)
        .set({
          status: 'rejected',
          updatedAt: new Date(),
        })
        .where(eq(operationalIntents.id, intentId));

      await db.insert(operationalApprovals).values({
        intentId,
        actorId: 'founder',
        decision: 'rejected',
        reason: reason || 'Rejected via Control Plane API',
      });

      return NextResponse.json({ success: true, intentId, status: 'REJECTED' });
    }

    return NextResponse.json({ code: 'UNKNOWN_ACTION', message: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('[ControlPlane API: intents POST] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}
