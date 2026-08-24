import { NextRequest, NextResponse } from 'next/server';
import { 
  TelegramAuthValidator, 
  HermesTenantMembershipService, 
  HermesWorkspaceResolver, 
  SessionTokenService,
  HermesAuthError,
  HermesTenantAccessDeniedError
} from '@/lib/hermes/auth';

const authValidator = new TelegramAuthValidator();
const membershipService = new HermesTenantMembershipService();
const tokenService = new SessionTokenService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { initData, targetWorkspace } = body;

    if (!initData || typeof initData !== 'string') {
      return NextResponse.json(
        { success: false, error: 'initData string is required', code: 'MISSING_INIT_DATA' },
        { status: 400 }
      );
    }

    // 1. Cryptographic HMAC validation & freshness check
    const identity = authValidator.validateInitData(initData);

    // 2. Resolve all authorized workspaces for this operator
    const authorizedTenants = await membershipService.getAuthorizedTenants(identity.telegramUserId);

    if (authorizedTenants.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No authorized workspaces found for this Telegram account.', 
          code: 'NO_AUTHORIZED_WORKSPACES',
          telegramUserId: identity.telegramUserId,
          authorizedTenants: []
        },
        { status: 403 }
      );
    }

    // 3. Determine target organization UUID
    let targetOrgId: string;

    if (targetWorkspace) {
      // Resolve provided slug/UUID/id to canonical UUID
      const resolved = await HermesWorkspaceResolver.resolveCanonicalWorkspace(targetWorkspace);
      targetOrgId = resolved.organizationId;
    } else {
      // Default to first authorized tenant (prioritizing OWNER/ADMIN)
      const preferred = authorizedTenants.find(t => t.isOwner || t.role === 'ADMIN') || authorizedTenants[0]!;
      targetOrgId = preferred.organizationId;
    }

    // 4. Validate access and issue HermesSession
    const session = await membershipService.validateTenantAccess({
      telegramUserId: identity.telegramUserId,
      targetOrganizationId: targetOrgId,
      username: identity.username,
      sessionDurationSeconds: 86400, // 24 hours
    });

    // 5. Issue signed compact JWT
    const token = tokenService.issueToken(session);

    return NextResponse.json({
      success: true,
      session,
      token,
      authorizedTenants,
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
    console.error('[API /api/v1/hermes/tma/auth] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal authentication error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
