import { NextRequest, NextResponse } from 'next/server';
import { SessionTokenService } from '@saasfly/hermes-core';
import { collectSystemStatus } from '@saasfly/hermes-core';
import { checkRateLimit, clientIpFromHeaders } from '@saasfly/hermes-core';

const tokenService = new SessionTokenService();

export async function GET(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`tma-status:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too Many Requests', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication token is required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const payload = tokenService.verifyToken(token);

    if (!payload.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Session has no active workspace', code: 'NO_ACTIVE_WORKSPACE' },
        { status: 403 }
      );
    }

    const status = await collectSystemStatus(payload.organizationId);

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/tma/status] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal error', code: 'STATUS_ERROR' },
      { status: 500 }
    );
  }
}
