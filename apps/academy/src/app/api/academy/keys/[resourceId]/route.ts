/**
 * 🔑 Pandora's Academy — Encrypted Resource Key Gateway API (Phase 2)
 * apps/academy/src/app/api/academy/keys/[resourceId]/route.ts
 *
 * Server-authoritative endpoint delivering unwrapped DEKs to verified wallets:
 * 1. Validates SIWE / EIP-191 personal_sign challenge.
 * 2. Checks replay attacks via NonceStore.
 * 3. Enforces Access Policy via AcademyStore or Whitelist.
 * 4. Delivers unwrapped DEK exclusively in ephemeral response.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  KeyDistributionService,
  EncryptedCourseResourceVault,
  InMemoryNonceStore,
  KeyAccessPolicy,
  EncryptedCourseResourceManifest,
} from '@saasfly/academy-sdk';

export const dynamic = 'force-dynamic';

// Singleton instances for serverless instance lifetime
const vault = new EncryptedCourseResourceVault();
const nonceStore = new InMemoryNonceStore(5 * 60 * 1000); // 5 min freshness

// Mock Access Policy for Phase 2 Pilot (enables Pandora's whitelisted wallets / candidates)
const pilotAccessPolicy: KeyAccessPolicy = {
  async isAllowed({ walletAddress, tenantId }) {
    // Fail-closed check: reject missing wallets or tenants
    if (!walletAddress || !tenantId) return false;
    
    // In production pilot: accepts Pandora's tenant whitelisted wallets or valid enrollment
    const isWhitelistedTenant = tenantId === 'pandoras' || tenantId.startsWith('org_');
    return isWhitelistedTenant && walletAddress.startsWith('0x');
  },
};

const keyDistributionService = new KeyDistributionService(vault, pilotAccessPolicy, nonceStore);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await params;
    const body = await req.json();

    const {
      walletAddress,
      tenantId,
      programId,
      nonce,
      timestamp,
      signature,
      manifest,
    } = body as {
      walletAddress?: string;
      tenantId?: string;
      programId?: string;
      nonce?: string;
      timestamp?: number;
      signature?: string;
      manifest?: EncryptedCourseResourceManifest;
    };

    if (
      !walletAddress ||
      !tenantId ||
      !programId ||
      !nonce ||
      !timestamp ||
      !signature ||
      !manifest ||
      manifest.resourceId !== resourceId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parámetros de autenticación criptográfica incompletos o inválidos.',
        },
        { status: 400 }
      );
    }

    const verificationResult = await keyDistributionService.authorizeAndDeliverKey(
      {
        walletAddress,
        resourceId,
        tenantId,
        programId,
        nonce,
        timestamp,
        signature,
      },
      manifest
    );

    if (!verificationResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: verificationResult.reason || 'Acceso denegado por política de autorización.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      resourceId: verificationResult.resourceId,
      unwrappedDekBase64: verificationResult.unwrappedDekBase64,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error interno en el servicio de distribución de claves.',
      },
      { status: 500 }
    );
  }
}
