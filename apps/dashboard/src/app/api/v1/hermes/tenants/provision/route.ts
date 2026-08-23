/**
 * 🏛️ HERMES OS — Tenant Provisioning API Route
 * apps/dashboard/src/app/api/v1/hermes/tenants/provision/route.ts
 *
 * POST /api/v1/hermes/tenants/provision
 * Provision a new tenant's Sovereign Intelligence Stack:
 * - Compiles deterministic FACT claims
 * - Envelope-encrypts and anchors ClaimContract to IPFS
 * - Generates and signs TenantAuthorityManifest with Hermes Agent Wallet
 * - Dynamically registers response policies & soul persona
 */

import { NextRequest, NextResponse } from 'next/server';
import { TenantProvisioner } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-provisioner';
import { TenantGateway } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-gateway';
import { TenantIntelligenceProvisionInput } from '@/lib/pandoras/core/domains/hermes/tenants/contracts';

export async function POST(req: NextRequest) {
  try {
    const body: TenantIntelligenceProvisionInput = await req.json();

    if (!body || !body.tenantId || !body.organizationName) {
      return NextResponse.json(
        {
          error: 'BAD_REQUEST',
          message: 'tenantId and organizationName are mandatory in provisioning payload.',
        },
        { status: 400 }
      );
    }

    // Verify Authorization via TenantGateway if Authorization header is present
    const authResult = await TenantGateway.authenticateRequest(req, body.tenantId, 'ADMIN_GOVERNANCE');
    
    // In dev / initial onboarding we allow initial provision if key matches or dev mode
    if (!authResult.allowed && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          error: authResult.errorCode,
          message: authResult.errorMessage,
        },
        { status: 403 }
      );
    }

    const result = await TenantProvisioner.provisionTenantIntelligence(body);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API:hermes/tenants/provision] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to provision tenant intelligence.',
      },
      { status: 500 }
    );
  }
}
