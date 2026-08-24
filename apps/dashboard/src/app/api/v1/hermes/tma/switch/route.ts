import { NextRequest, NextResponse } from 'next/server';
import {
  HermesTenantMembershipService,
  HermesWorkspaceResolver,
  SessionTokenService,
  HermesAuthError,
  HermesTenantAccessDeniedError
} from '@/lib/hermes/auth';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';

const membershipService = new HermesTenantMembershipService();
const tokenService = new SessionTokenService();

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(`tma-switch:${clientIpFromHeaders(req.headers)}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too Many Requests', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const authHeader = req.headers.get('authorization');
    const body = await req.json().catch(() => ({}));
    
    // Extract token from Bearer header or body
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : body.token;
    
    const targetWorkspace = body.targetOrganizationId || body.targetWorkspace;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication token is required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    if (!targetWorkspace) {
      return NextResponse.json(
        { success: false, error: 'targetOrganizationId or targetWorkspace is required', code: 'MISSING_TARGET_WORKSPACE' },
        { status: 400 }
      );
    }

    // 1. Verify existing session token integrity and expiry
    const payload = tokenService.verifyToken(token);

    // 2. Resolve target organization to canonical UUID
    // Anti-enumeración: workspace inexistente responde igual que acceso denegado.
    let resolved;
    try {
      resolved = await HermesWorkspaceResolver.resolveCanonicalWorkspace(targetWorkspace);
    } catch {
      throw new HermesAuthError('No tienes acceso a este workspace.', 'TENANT_ACCESS_DENIED', 403);
    }

    // 3. Re-validate membership strictly on new UUID
    const newSession = await membershipService.validateTenantAccess({
      telegramUserId: payload.telegramUserId,
      targetOrganizationId: resolved.organizationId,
      sessionDurationSeconds: 86400,
    });

    // 4. Issue new token for the switched workspace context
    const newToken = tokenService.issueToken(newSession);

    return NextResponse.json({
      success: true,
      session: newSession,
      token: newToken,
    });
  } catch (err: any) {
    if (err instanceof HermesTenantAccessDeniedError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: 403 }
      );
    }
    if (err instanceof HermesAuthError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }
    console.error('[API /api/v1/hermes/tma/switch] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal workspace switch error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
