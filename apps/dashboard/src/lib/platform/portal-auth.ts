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
import { installedProducts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const PORTAL_JWT_SECRET = process.env.PORTAL_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'pandoras-portal-dev-secret';
const PORTAL_SESSION_DURATION_DAYS = 30;
const PORTAL_TOKEN_EXPIRY = '7d';

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

  return jwt.sign(payload, PORTAL_JWT_SECRET, { expiresIn: PORTAL_TOKEN_EXPIRY });
}

// ── Token Validation & Consumption ───────────────────────────────────────────

/**
 * Validate and consume a portal magic link token.
 * Single-use: marks portalTokenUsed = true, creates a session token.
 *
 * Returns a PortalSession on success, throws on invalid/used/expired token.
 */
export async function consumePortalToken(token: string): Promise<PortalSession> {
  // 1. Verify JWT signature & expiry
  let payload: PortalTokenPayload;
  try {
    payload = jwt.verify(token, PORTAL_JWT_SECRET) as PortalTokenPayload;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    throw new Error(`[PortalAuth] JWT validation failed: ${message}`);
  }

  if (payload.type !== 'portal_access') {
    throw new Error('[PortalAuth] Invalid token type');
  }

  // 2. Find installed product and check token matches & hasn't been used
  const installed = await db.query.installedProducts.findFirst({
    where: and(
      eq(installedProducts.id, payload.sub),
      eq(installedProducts.portalToken, token),
      eq(installedProducts.portalTokenUsed, false)
    ),
  });

  if (!installed) {
    throw new Error('[PortalAuth] Token not found, already used, or mismatch');
  }

  // 3. Create session token & mark magic link as consumed
  const sessionToken = `ps_${randomUUID().replace(/-/g, '')}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PORTAL_SESSION_DURATION_DAYS);

  await db.update(installedProducts)
    .set({
      portalTokenUsed: true,
      portalSessionToken: sessionToken,
      updatedAt: new Date(),
    })
    .where(eq(installedProducts.id, installed.id));

  return {
    sessionToken,
    installedProductId: installed.id,
    projectId: installed.projectId,
    product: installed.product,
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
} | null> {
  if (!sessionToken || !sessionToken.startsWith('ps_')) return null;

  const installed = await db.query.installedProducts.findFirst({
    where: eq(installedProducts.portalSessionToken, sessionToken),
    columns: { id: true, projectId: true, product: true, status: true },
  });

  if (!installed || installed.status === 'suspended') return null;

  return {
    installedProductId: installed.id,
    projectId: installed.projectId,
    product: installed.product,
  };
}
