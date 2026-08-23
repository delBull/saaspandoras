/**
 * 🏛️ HERMES OS — Tenant Governance Claims API Route
 * apps/dashboard/src/app/api/v1/hermes/tenants/[tenantId]/governance/claims/route.ts
 *
 * GET  /api/v1/hermes/tenants/[tenantId]/governance/claims -> List active and governed claims
 * POST /api/v1/hermes/tenants/[tenantId]/governance/claims -> Promote / Add a claim (bumps version & re-anchors)
 */

import { NextRequest, NextResponse } from 'next/server';
import { TenantGovernanceService } from '@/lib/pandoras/core/domains/hermes/tenants/governance-service';
import { TenantGateway } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-gateway';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const authResult = await TenantGateway.authenticateRequest(req, tenantId, 'READ_ONLY');

    if (!authResult.allowed && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: authResult.errorCode, message: authResult.errorMessage },
        { status: 403 }
      );
    }

    const claimsData = await TenantGovernanceService.getTenantClaims(tenantId);

    return NextResponse.json(
      {
        success: true,
        data: claimsData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API:governance/claims GET] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const authResult = await TenantGateway.authenticateRequest(req, tenantId, 'ADMIN_GOVERNANCE');

    if (!authResult.allowed && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: authResult.errorCode, message: authResult.errorMessage },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body || !body.claim || !body.claim.claimId || !body.claim.canonicalAssertion) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'claim with claimId and canonicalAssertion is required' },
        { status: 400 }
      );
    }

    const updatedContract = await TenantGovernanceService.promoteClaim({
      tenantId,
      claim: body.claim,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          version: updatedContract.version,
          contractHash: updatedContract.contractHash,
          ipfsCid: updatedContract.ipfsCid,
          claimsCount: updatedContract.claims.length,
          updatedAt: updatedContract.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API:governance/claims POST] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}
