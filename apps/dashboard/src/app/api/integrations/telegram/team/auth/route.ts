/**
 * 🔐 POST /api/integrations/telegram/team/auth
 * apps/dashboard/src/app/api/integrations/telegram/team/auth/route.ts
 *
 * Nexus TMA Authentication Endpoint.
 *
 * Input:  { initData: string }  (Telegram WebApp.initData)
 * Output: { session: NexusTmaSession } with 8-hour TTL
 *
 * Security Chain:
 *   1. Validates Content-Type + body shape.
 *   2. resolveNexusTmaSession() → full HMAC + age + RBAC chain (fail-closed).
 *   3. Returns 200 with session on success.
 *   4. Maps NexusTmaAuthError subclasses to appropriate HTTP status codes.
 *   5. Logs auth events (success + failure) without leaking secrets.
 *
 * Invariants:
 *   - NO session cookies issued — Nexus TMA is stateless; clients store the session.
 *   - NO TELEGRAM_BOT_TOKEN (Hermes) used — only TELEGRAM_TEAM_BOT_TOKEN.
 *   - Raw initData is NEVER logged.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  resolveNexusTmaSession,
  NexusTmaAuthError,
} from '@/lib/nexus/nexus-tma-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'INVALID_BODY' },
      { status: 400 }
    );
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).initData !== 'string' ||
    !(body as Record<string, unknown>).initData
  ) {
    return NextResponse.json(
      { error: 'Missing required field: initData (string)', code: 'MISSING_INIT_DATA' },
      { status: 400 }
    );
  }

  const rawInitData = (body as { initData: string }).initData;

  // 2. Resolve session (fail-closed — all auth errors throw)
  try {
    const session = await resolveNexusTmaSession(rawInitData);
    (session as any).token = rawInitData;

    console.info(
      `[NexusTmaAuth] ✅ Authenticated collaborator #${session.collaboratorId} (${session.role}) ` +
      `with ${session.capabilities.length} capabilities. tgUserId=***`
    );

    return NextResponse.json({ session }, { status: 200 });

  } catch (err: unknown) {
    if (err instanceof NexusTmaAuthError) {
      const level = err.statusCode >= 500 ? 'error' : 'warn';
      console[level](`[NexusTmaAuth] Auth failed: [${err.code}] ${err.message}`);

      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }

    // Unknown error — internal fault
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[NexusTmaAuth] Unexpected error:', message);
    return NextResponse.json(
      { error: 'Internal authentication error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
