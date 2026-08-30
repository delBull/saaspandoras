/**
 * 🛡️ Pandora's Academy Admin Authentication Guard
 * apps/dashboard/src/lib/pandoras/core/domains/academy/security/admin-auth.ts
 */

import { NextRequest } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';
import { verifyUnlockToken, verifyAcademyToken } from '@/lib/nexus-deals/tokens';
import { headers } from 'next/headers';

export async function verifyAdminRequest(req?: NextRequest | Request): Promise<boolean> {
  // 1. Check Internal Secret Header
  const internalSecret = process.env.PANDORAS_INTERNAL_SECRET || process.env.CRON_SECRET || '';
  let authHeader = '';
  let unlockHeader = '';
  let unlockQuery = '';

  if (req && 'headers' in req) {
    authHeader = req.headers.get('authorization') || '';
    unlockHeader = req.headers.get('x-admin-unlock') || '';
    if ('nextUrl' in req) {
      unlockQuery = req.nextUrl.searchParams.get('unlock') || '';
    } else if ('url' in req) {
      try {
        const url = new URL(req.url);
        unlockQuery = url.searchParams.get('unlock') || '';
      } catch {
        // ignore
      }
    }
  }

  if (internalSecret && authHeader === `Bearer ${internalSecret}`) {
    return true;
  }

  // 2. Check Academy / Discord HMAC Unlock Token (from query param or custom header)
  const unlockToken = unlockQuery || unlockHeader;
  if (unlockToken) {
    const academyAuth = await verifyAcademyToken(unlockToken);
    if (academyAuth.valid) return true;
    const isUnlocked = await verifyUnlockToken(unlockToken);
    if (isUnlocked) return true;
  }

  // 3. Check Authenticated Web3 Admin Session
  try {
    const requestHeaders = await headers();
    const { session, isVerified } = await getAuth(requestHeaders);
    if (isVerified && session?.address && (await isAdmin(session.address))) {
      return true;
    }
  } catch (err) {
    // Continue
  }

  // 4. In development mode with explicit bypass
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_ADMIN_AUTH === 'true') {
    return true;
  }

  return false;
}
