/**
 * 🌐 Thin API Route: Tenant Provisioning Boundary
 * apps/dashboard/src/app/api/v1/internal/onboarding/provision/route.ts
 *
 * HTTP entrypoint delegating strictly to TenantProvisioningService.
 * Zero business logic inside the route handler.
 */

import { NextRequest, NextResponse } from 'next/server';
import { tenantProvisioningService } from '@/lib/provisioning/tenant-provisioning.service';
import type { ProvisioningRequestDTO } from '@/lib/dash-contracts/provisioning';
import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    const actorWallet = req.headers.get('x-wallet-address') || 
                        req.headers.get('x-thirdweb-address') || 
                        auth.session?.address;

    if (!actorWallet || !tenantProvisioningService.isValidWalletAddress(actorWallet)) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED_ACTOR: A valid connected wallet is required to provision a tenant.' },
        { status: 401 }
      );
    }

    const body: ProvisioningRequestDTO = await req.json();

    if (!body || !body.organization || !body.organization.name) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST: Organization name and payload are required.' },
        { status: 400 }
      );
    }

    const result = await tenantProvisioningService.provisionTenant(body, actorWallet);

    return NextResponse.json(result, { status: result.isIdempotentReplay ? 200 : 201 });
  } catch (err: any) {
    console.error('[TenantProvisioningAPI] Error:', err?.message || err);
    
    const statusCode = err?.message?.startsWith('UNAUTHORIZED') ? 401
      : err?.message?.includes('CONFLICT') ? 409
      : err?.message?.startsWith('INVALID') ? 400
      : 500;

    return NextResponse.json(
      { error: err?.message || 'INTERNAL_PROVISIONING_ERROR' },
      { status: statusCode }
    );
  }
}
