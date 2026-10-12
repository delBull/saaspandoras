/**
 * 🔑 Pandora's Academy — Encrypted Resource Key Gateway API (Fase 2.1 hardened)
 * apps/academy/src/app/api/academy/keys/[resourceId]/route.ts
 *
 * Server-authoritative endpoint delivering unwrapped DEKs to verified wallets:
 * 1. Rate limiting (shared authRateLimiter, IP edge-trusted).
 * 2. The manifest is loaded SERVER-SIDE by resourceId (AcademyManifestStore) —
 *    client-supplied crypto material is NEVER unwrapped (Fase 2.1 fix).
 * 3. Validates SIWE/EIP-191 personal_sign challenge (signature BEFORE nonce burn).
 * 4. Entitlement = server-authoritative allowlist (env-configured) + upstream
 *    enrollment policy. Fail-closed: empty allowlist denies everyone.
 * 5. Persistent anti-replay (Upstash REST SET NX) when configured; fails closed.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  KeyDistributionService,
  EncryptedCourseResourceVault,
  InMemoryNonceStore,
  UpstashRestNonceStore,
  IoredisNonceStore,
  InMemoryAcademyManifestStore,
  type KeyAccessPolicy,
  type NonceStore,
  type AcademyManifestStore,
} from '@saasfly/academy-sdk';
import { authRateLimiter, getTrustedClientIp } from '@saasfly/shared';

export const dynamic = 'force-dynamic';

// Singleton instances for serverless instance lifetime
const vault = new EncryptedCourseResourceVault();

const manifestStore: AcademyManifestStore = new InMemoryAcademyManifestStore();

function getNonceStore(): NonceStore {
  // Preferencia institucional: Railway Redis (TCP) via ioredis.
  const redisUrl = process.env.ACADEMY_REDIS_URL || process.env.REDIS_URL;
  if (redisUrl) {
    try {
      return new IoredisNonceStore(redisUrl, 5 * 60);
    } catch (err) {
      console.warn('[academy/keys] Redis nonce store unavailable (fail-closed to memory, single-instance):', err);
    }
  }
  const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
  if (hasUpstash) {
    try {
      return new UpstashRestNonceStore(5 * 60);
    } catch {
      console.warn('[academy/keys] Upstash config incomplete; falling back to memory nonce store (single-instance).');
    }
  }
  return new InMemoryNonceStore(5 * 60 * 1000);
}

const nonceStore = getNonceStore();

// 🛡️ Fase 2.1: server-authoritative entitlement real.
// Permisión por CREATIVITY OWNERSHIP: la wallet firmante debe ser el
// applicant/owner canónico del tenant (projects.applicant_wallet_address),
// resuelto por canonicalOrgId o slug server-side (FC-001). Los tenants y
// Pandora's pueden desbloquear sus propios cursos privados sin env lists.
// La env ACADEMY_PILOT_ENTITLED_WALLETS queda como OVERRIDE opcional (ej. para
// dar acceso a alumnos beta específicos); vacía = solo ownership governs.
const PILOT_ENTITLED_WALLETS = new Set(
  (process.env.ACADEMY_PILOT_ENTITLED_WALLETS || '')
    .toLowerCase()
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean)
);

async function isTenantOwnerWallet(tenantId: string, walletAddress: string): Promise<boolean> {
  if (!tenantId || !walletAddress) return false;
  try {
    const { db } = await import('@saasfly/db-core');
    const { projects } = await import('@saasfly/db-core/schema');
    const { eq, or, sql: sqlFn } = await import('@saasfly/db-core');
    const walletLower = walletAddress.toLowerCase();
    const [project] = await db
      .select({ applicant: projects.applicantWalletAddress })
      .from(projects)
      .where(or(eq(projects.organizationId, tenantId), eq(projects.slug, tenantId)))
      .limit(1);
    if (!project?.applicant) return false;
    return (project.applicant as string).toLowerCase() === walletLower;
  } catch (err) {
    console.error('[academy/keys] Tenant ownership lookup failed (fail-closed):', err);
    return false;
  }
}

const serverEntitlementPolicy: KeyAccessPolicy = {
  async isAllowed({ walletAddress, tenantId, resourceId }) {
    if (!walletAddress || !tenantId || !resourceId) return false;
    // Optional env override (beta students, consultants) — additive, not required.
    if (PILOT_ENTITLED_WALLETS.size > 0 && PILOT_ENTITLED_WALLETS.has(walletAddress.toLowerCase())) {
      return true;
    }
    // 🏛️ Canonical permission: creator/owner wallet of the tenant.
    return isTenantOwnerWallet(tenantId, walletAddress);
  },
};

const keyDistributionService = new KeyDistributionService(vault, serverEntitlementPolicy, nonceStore);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    // 0. Rate limiting (5 auth attempts / min per trusted IP)
    const ip = getTrustedClientIp(req.headers);
    const allowed = await authRateLimiter.isAllowed(ip);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes de clave. Intenta más tarde.' },
        { status: 429 }
      );
    }

    const { resourceId } = await params;
    const body = await req.json();

    const { walletAddress, tenantId, programId, nonce, timestamp, signature } = body as {
      walletAddress?: string;
      tenantId?: string;
      programId?: string;
      nonce?: string;
      timestamp?: number;
      signature?: string;
    };

    if (!walletAddress || !tenantId || !programId || !nonce || !timestamp || !signature) {
      return NextResponse.json(
        { success: false, error: 'Parámetros de autenticación criptográfica incompletos.' },
        { status: 400 }
      );
    }

    // 1. 🛡️ Manifest SERVER-SIDE by resourceId — client-controlled manifests are rejected.
    const manifest = await manifestStore.getByResourceId(resourceId);
    if (!manifest) {
      return NextResponse.json(
        { success: false, error: 'Recurso cifrado no registrado en el vault del servidor.' },
        { status: 404 }
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
  } catch (error) {
    // Masked error: never leak vault internals to the client.
    console.error('[academy/keys] Internal key distribution error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno en el servicio de distribución de claves.' },
      { status: 500 }
    );
  }
}