'use server';

/**
 * 🏛️ Admin Portal Bridge — Server Action
 * src/app/admin/actions/open-hq-portal.ts
 *
 * Allows an authenticated Platform Admin to access the HQ Growth OS portal
 * (/portal/pandoras) without requiring a magic link, by generating a virtual
 * portal session token and setting it as a server-side cookie.
 *
 * Security:
 *  - Requires isAdmin(wallet) validation — any non-admin call returns an error.
 *  - Token is virtual (ps_v_<projectId>_<uuid>), following the existing
 *    validatePortalSession fallback path in portal-auth.ts (lines 181-218).
 *  - Cookie is HttpOnly, SameSite=Lax, 1h TTL — minimal blast radius.
 */

import { cookies, headers } from 'next/headers';
import { randomUUID } from 'crypto';
import { getAuth, isAdmin } from '@/lib/auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';

const PORTAL_SESSION_COOKIE = 'pandoras_portal_session';
const HQ_ORG_SLUG = 'pandoras';
const TTL_SECONDS = 60 * 60; // 1 hour

export async function openHQPortalAction(): Promise<
  { success: true; redirectTo: string } | { success: false; error: string }
> {
  try {
    // 1. Resolve wallet from session
    const reqHeaders = await headers();
    const { session } = await getAuth(reqHeaders);
    const walletAddress = session?.address;

    if (!walletAddress) {
      return { success: false, error: 'No wallet session found.' };
    }

    // 2. Fail closed: must be admin
    const adminCheck = await isAdmin(walletAddress);
    if (!adminCheck) {
      return { success: false, error: 'Forbidden: Platform Admin access required.' };
    }

    // 3. Resolve the pandoras org project ID (dynamic, not hardcoded)
    let projectId: number;
    try {
      const org = await OrganizationSDK.resolve(HQ_ORG_SLUG, 'HERMES');
      projectId = org.projectId;
    } catch (resolveErr) {
      console.error('[openHQPortalAction] Org Resolve Error:', resolveErr);
      return { 
        success: false, 
        error: 'El tenant interno HQ Growth OS no fue encontrado. Es necesario correr el seed-hq-tenant para crearlo.' 
      };
    }

    // 4. Generate a virtual session token (matches validatePortalSession ps_v_ path)
    const sessionToken = `ps_v_${projectId}_${randomUUID().replace(/-/g, '')}`;

    // 5. Set HttpOnly cookie — server-side only, so no JS can read it
    const cookieStore = await cookies();
    cookieStore.set(PORTAL_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: TTL_SECONDS,
      // secure in production (Vercel sets HTTPS automatically)
      secure: process.env.NODE_ENV === 'production',
    });

    // 6. Return absolute URL to the dash subdomain to avoid admin middleware rewrite
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://dash.pandoras.finance'
        : 'https://staging.dash.pandoras.finance');

    return {
      success: true,
      redirectTo: `${baseUrl}/portal/${HQ_ORG_SLUG}`,
    };
  } catch (err) {
    console.error('[openHQPortalAction] Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Internal error.',
    };
  }
}
