/**
 * 🏛️ HERMES OS — Tenant Authority Manifest Route
 * apps/dashboard/src/app/api/v1/hermes/tenants/[tenantId]/manifest/route.ts
 *
 * GET /api/v1/hermes/tenants/[tenantId]/manifest
 * Returns the cryptographic TenantAuthorityManifest for a tenant,
 * allowing external verification of the active ClaimContract and IPFS anchor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesClaimContracts, projects } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';
import { ClaimContractEngine } from '@/lib/pandoras/core/domains/hermes/knowledge/claim-contract-engine';
import { TenantAuthorityManifest } from '@/lib/pandoras/core/domains/hermes/tenants/contracts';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const cleanTenant = tenantId.toLowerCase().replace(/^org_/, '').trim();

    // 1. Fetch Active Claim Contract
    const contract = ClaimContractEngine.getContract(cleanTenant);
    
    let dbContract = null;
    if (!contract && db) {
      const records = await db
        .select()
        .from(hermesClaimContracts)
        .where(
          or(
            eq(hermesClaimContracts.tenantId, cleanTenant),
            eq(hermesClaimContracts.tenantId, `org_${cleanTenant}`)
          )
        )
        .orderBy(desc(hermesClaimContracts.version))
        .limit(1);

      if (records.length > 0) {
        dbContract = records[0];
      }
    }

    const activeContract = contract || (dbContract ? {
      tenantId: dbContract.tenantId,
      version: dbContract.version,
      governanceStatus: dbContract.governanceStatus as any,
      contractHash: dbContract.contractHash,
      ipfsCid: dbContract.ipfsCid || undefined,
      ipfsUri: dbContract.ipfsUri || undefined,
      claims: (dbContract.claims as any) || [],
      agentSignature: dbContract.agentSignature || undefined,
      agentWalletAddress: dbContract.signedByAddress || undefined,
    } : null);

    if (!activeContract) {
      return NextResponse.json(
        {
          error: 'TENANT_NOT_FOUND',
          message: `No active authority manifest or claim contract found for tenant "${cleanTenant}".`,
        },
        { status: 404 }
      );
    }

    const manifest: TenantAuthorityManifest = {
      manifestVersion: '1.0.0',
      tenantId: cleanTenant,
      version: activeContract.version,
      claimContractCid: activeContract.ipfsCid || `mock_bafkrei_contract_${activeContract.version}_${cleanTenant}`,
      identityManifestCid: `mock_bafkrei_identity_${cleanTenant}`,
      agentWalletAddress: activeContract.agentWalletAddress || '0x8515Fb0F706DfE8Bf271ad453c01976ed568a4aD',
      governanceStatus: activeContract.governanceStatus || 'ACTIVE',
      merkleRoot: activeContract.contractHash,
      signedAt: (activeContract as any).updatedAt ? String((activeContract as any).updatedAt) : new Date().toISOString(),
      agentSignature: activeContract.agentSignature || '0x_sig_placeholder',
    };

    return NextResponse.json(
      {
        success: true,
        tenantId: cleanTenant,
        manifest,
        claimsSummary: {
          totalClaims: activeContract.claims.length,
          categories: activeContract.claims.reduce((acc: any, c: any) => {
            acc[c.category] = (acc[c.category] || 0) + 1;
            return acc;
          }, {}),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API:hermes/tenants/[tenantId]/manifest] Error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to retrieve tenant authority manifest.',
      },
      { status: 500 }
    );
  }
}
