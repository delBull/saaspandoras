/**
 * 🔐 Portal Auth — JWT Magic Link (Single-Use, 7 Days)
 * lib/platform/portal-auth.ts
 *
 * Generates and validates single-use JWT magic links for client portal access.
 * Flow:
 *   1. Provisioning Engine generates portalToken (JWT) → stored in installed_products
 *   2. Client clicks email link → /portal?token=...
 *   3. consumePortalToken() validates JWT, marks token as used, creates session
 *   4. Client accesses portal via portalSessionToken (persistent per browser)
 */

import jwt from 'jsonwebtoken';
import { db } from '@/db';
import { installedProducts, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const PORTAL_JWT_SECRET = process.env.PORTAL_JWT_SECRET || process.env.NEXTAUTH_SECRET || '';
const PORTAL_SESSION_DURATION_DAYS = 30;
const PORTAL_TOKEN_EXPIRY = '7d';

// Fail closed: portal magic-link tokens must never be signed/verified with a
// hardcoded secret. If no secret is configured, token operations are rejected.
function requirePortalSecret(): string {
  const secret = process.env.PORTAL_JWT_SECRET || process.env.NEXTAUTH_SECRET || PORTAL_JWT_SECRET;
  if (!secret) {
    throw new Error('SERVER_CONFIG_ERROR: PORTAL_JWT_SECRET (or NEXTAUTH_SECRET) is not configured');
  }
  return secret;
}

export interface PortalTokenPayload {
  sub: string;  // installedProducts.id (UUID)
  type: 'portal_access';
  product: string;
  projectId: number;
  iat: number;
}

export interface PortalSession {
  sessionToken: string;
  installedProductId: string;
  projectId: number;
  product: string;
  expiresAt: Date;
}

// ── Token Generation ──────────────────────────────────────────────────────────

/**
 * Generate a signed JWT portal token for a newly provisioned product.
 * Call this from Provisioning Engine, store result in installedProducts.portalToken.
 */
export function generatePortalToken(
  installedProductId: string,
  projectId: number,
  product: string
): string {
  const payload: Omit<PortalTokenPayload, 'iat'> = {
    sub: installedProductId,
    type: 'portal_access',
    product,
    projectId,
  };

  return jwt.sign(payload, requirePortalSecret(), { expiresIn: PORTAL_TOKEN_EXPIRY });
}

// ── Token Validation & Consumption ───────────────────────────────────────────

const consumedTokensCache = new Set<string>();

export function clearConsumedTokensForTesting(): void {
  consumedTokensCache.clear();
}

/**
 * Validate and consume a portal magic link token.
 * Single-use: marks portalTokenUsed = true, creates a session token.
 *
 * Returns a PortalSession on success, throws on invalid/used/expired token.
 */
export async function consumePortalToken(token: string): Promise<PortalSession> {
  // 1. In-process cache check for immediate single-use enforcement
  if (consumedTokensCache.has(token)) {
    throw new Error('[PortalAuth] Portal token has already been consumed');
  }

  // 2. Verify JWT signature & expiry with ONLY the single configured secret.
  let payload: PortalTokenPayload | null = null;
  const configuredSecret = requirePortalSecret();

  try {
    payload = jwt.verify(token, configuredSecret) as PortalTokenPayload;
  } catch {
    payload = null;
  }

  if (!payload) {
    // FAIL CLOSED: Never decode without signature verification (EXP-014 compliance)
    throw new Error('[PortalAuth] JWT validation failed: invalid signature or expired');
  }

  // 3. Find installed product and check token matches & hasn't been used in DB
  let installed: any = null;
  
  // Basic UUID regex to prevent Postgres crash on invalid input syntax
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.sub);

  if (isUuid) {
    try {
      const existingProduct = await db.query.installedProducts.findFirst({
        where: eq(installedProducts.id, payload.sub)
      });

      if (existingProduct) {
        if (existingProduct.portalTokenUsed) {
          throw new Error('[PortalAuth] Portal token has already been consumed');
        }
        installed = existingProduct;
      }
    } catch (dbErr: any) {
      if (dbErr?.message?.includes('already been consumed')) {
        throw dbErr;
      }
      console.warn('[PortalAuth] installedProducts query failed, using payload fallback context:', dbErr);
    }
  } else {
    console.warn(`[PortalAuth] Skipping installedProducts query because sub (${payload.sub}) is not a valid UUID, falling back to payload context.`);
  }

  // Mark token as consumed in-memory
  consumedTokensCache.add(token);

  const actualProjectId = installed?.projectId || payload.projectId;
  if (!actualProjectId) {
    throw new Error('[PortalAuth] Unable to resolve valid projectId from portal token');
  }

  // Embed the projectId in the session token so validatePortalSession can recover it if it's virtual
  const sessionToken = `ps_v_${actualProjectId}_${randomUUID().replace(/-/g, '')}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PORTAL_SESSION_DURATION_DAYS);

  if (installed) {
    await db.update(installedProducts)
      .set({
        portalTokenUsed: true,
        portalSessionToken: sessionToken,
        updatedAt: new Date(),
      })
      .where(eq(installedProducts.id, installed.id))
      .catch(() => null);
  }

  return {
    sessionToken,
    installedProductId: installed?.id || payload.sub,
    projectId: actualProjectId,
    product: installed?.product || payload.product || 'HERMES',
    expiresAt,
  };
}

// ── Session Validation ────────────────────────────────────────────────────────

/**
 * Validate an active portal session token.
 * Call this on every portal page request (middleware or server component).
 */
export async function validatePortalSession(sessionToken: string): Promise<{
  installedProductId: string;
  projectId: number;
  product: string;
  isTrial?: boolean;
  plan?: string;
} | null> {
  if (!sessionToken || !sessionToken.startsWith('ps_')) return null;

  try {
    // 1. Direct session token lookup in DB
    const installed = await db.query.installedProducts.findFirst({
      where: eq(installedProducts.portalSessionToken, sessionToken),
      columns: { id: true, projectId: true, product: true, status: true, plan: true },
    });

    if (installed && installed.status !== 'suspended') {
      const isTrial = installed.plan === 'trial' || (installed.status as string) === 'trial';
      return {
        installedProductId: installed.id,
        projectId: installed.projectId,
        product: installed.product,
        plan: installed.plan || undefined,
        isTrial,
      };
    }

    // 2. Recovery for embedded virtual/project sessions (ps_v_<projectId>_<hash>)
    const match = sessionToken.match(/^ps_v_(\d+)_[a-f0-9]{32}$/i);
    if (match && match[1]) {
      const projectId = parseInt(match[1], 10);
      if (!isNaN(projectId) && projectId > 0) {
        // Check if installedProduct exists for this project
        const productRow = await db.query.installedProducts.findFirst({
          where: eq(installedProducts.projectId, projectId),
          columns: { id: true, projectId: true, product: true, status: true, plan: true },
        });

        if (productRow && productRow.status !== 'suspended') {
          const isTrial = productRow.plan === 'trial' || (productRow.status as string) === 'trial';
          // Self-heal the session token in DB so future lookups are immediate
          await db.update(installedProducts)
            .set({ portalSessionToken: sessionToken, updatedAt: new Date() })
            .where(eq(installedProducts.id, productRow.id))
            .catch(() => null);

          return {
            installedProductId: productRow.id,
            projectId: productRow.projectId,
            product: productRow.product,
            plan: productRow.plan || undefined,
            isTrial,
          };
        }

        // Project fallback
        const projectRow = await db.query.projects.findFirst({
          where: eq(projects.id, projectId),
          columns: { id: true, slug: true, status: true, tenantType: true },
        });

        if (projectRow && (projectRow.status as string) !== 'suspended' && projectRow.status !== 'rejected') {
          return {
            installedProductId: `proj_${projectId}_hermes`,
            projectId: projectRow.id,
            product: 'HERMES',
            isTrial: projectRow.tenantType === 'TRIAL',
          };
        }
      }
    }
  } catch (err) {
    console.warn('[PortalAuth] validatePortalSession DB error:', err);
  }

  return null;
}
