/**
 * 🔐 POST & GET /api/v1/tma/nexus/auth
 * apps/dashboard/src/app/api/v1/tma/nexus/auth/route.ts
 *
 * Canonical v1 route alias for Nexus TMA authentication.
 * Delegates directly to the hardened implementation at
 * /api/integrations/telegram/team/auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { POST as authHandler } from '@/app/api/integrations/telegram/team/auth/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return authHandler(req);
}
