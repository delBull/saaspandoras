/**
 * 🛰️ Growth OS API Boundary — NFT Lab Service
 * /api/v1/growth/nft-lab
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, operationalIntents, daoMembers } from '@/db/schema';
import { eq, or, count } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { isWalletAuthorizedForTenant } from '@/lib/hermes/auth/wallet-tenant-membership';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import type { 
  GetNftLabResponseDTO, 
  NftCollectionDTO 
} from '@/lib/dash-contracts/growth';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

async function resolveTenant(req: NextRequest, requestedOrg?: string | null): Promise<{
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

  // 3. Bearer Token
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
    const rl = checkRateLimit(`growth-nft-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const orgParam = searchParams.get('organizationId') || '';
    const cleanSlug = orgParam.replace(/^org_/, '').trim();

    const auth = await resolveTenant(req, orgParam);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Authentication required.' }, { status: 401 });
    }

    // 🔒 Capability Assertion Enforcement (Fail-Closed)
    try {
      await capabilityRegistry.assertCapability(auth.organizationId, 'growth.nft');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(or(eq(projects.slug, cleanSlug), eq(projects.slug, orgParam)))
      .limit(1);

    const [daoCountRes] = project
      ? await db.select({ val: count() }).from(daoMembers).where(eq(daoMembers.projectId, project.id))
      : [{ val: 0 }];
    const realMintedSupply = daoCountRes?.val ?? 0;

    const collections: NftCollectionDTO[] = [
      {
        id: 'col_participation_cert',
        name: `${project?.title || 'Tenant'} Participation Certificates`,
        symbol: `${(project?.slug || 'PNDR').toUpperCase().slice(0, 4)}-CERT`,
        type: 'CERTIFICATE',
        contractAddress: project?.contractAddress || '0x45a987c44756f40bdb2c8e87d2834fa121a897f',
        chainId: 8453, // Base
        totalSupply: (project as any)?.totalTokens || (project as any)?.totalShares || 1000,
        mintedSupply: realMintedSupply,
        royaltyFeeBps: 250, // 2.5%
        status: 'ACTIVE',
        metadataIpfsCid: 'bafkreicertificateproofipfs',
        createdAt: project?.createdAt ? project.createdAt.toISOString() : new Date().toISOString(),
      },
      {
        id: 'col_founder_pass',
        name: `${project?.title || 'Tenant'} VIP Founder Club Pass`,
        symbol: `${(project?.slug || 'PNDR').toUpperCase().slice(0, 4)}-VIP`,
        type: 'FOUNDER_PASS',
        chainId: 8453,
        totalSupply: 50,
        mintedSupply: Math.min(50, Math.floor(realMintedSupply / 2)),
        royaltyFeeBps: 500, // 5%
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      },
    ];

    const supportedChains = [
      { id: 8453, name: 'Base Mainnet', isTestnet: false },
      { id: 84532, name: 'Base Sepolia', isTestnet: true },
      { id: 137, name: 'Polygon Mainnet', isTestnet: false },
      { id: 1, name: 'Ethereum Mainnet', isTestnet: false },
    ];

    const response: GetNftLabResponseDTO = {
      collections,
      supportedChains,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Growth API: nft-lab GET] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}

/**
 * Mint Intent Creation — Governed via Operational Intents (F7.6)
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`growth-nft-post:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const body = await req.json();
    const { organizationId, collectionId, recipientAddress, tokenType } = body;

    const auth = await resolveTenant(req, organizationId);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Authentication required.' }, { status: 401 });
    }

    // 🔒 Capability Assertion
    try {
      await capabilityRegistry.assertCapability(auth.organizationId, 'growth.nft');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    // High risk action: creates Operational Intent for Governance Center approval
    const generatedIntentId = `intent_nft_mint_${Date.now()}`;
    await db.insert(operationalIntents).values({
      id: generatedIntentId,
      organizationId: auth.organizationId,
      missionId: 'nft_issuance_mission',
      packId: 'core_nft_pack',
      packVersion: '1.0.0',
      strategyDecisionId: 'decision_mint_1',
      intentType: 'growth.nft.mint.v1',
      objective: `Mint ${tokenType || 'Certificate'} for ${recipientAddress}`,
      rationale: `Authorized NFT generation for collection ${collectionId}`,
      status: 'proposed',
    });

    return NextResponse.json({
      success: true,
      intentId: generatedIntentId,
      status: 'GOVERNANCE_APPROVAL_REQUIRED',
      message: 'Intención de minteo registrada. Pendiente de aprobación en el Governance Center.',
    });
  } catch (error: any) {
    console.error('[Growth API: nft-lab POST] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}
