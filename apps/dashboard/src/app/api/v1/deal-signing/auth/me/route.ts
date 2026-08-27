import { NextRequest, NextResponse } from 'next/server';
import { SovereignAuthService } from '@/lib/deal-signing/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/deal-signing/auth/me
 * Returns current authenticated Sovereign Sign session
 */
export async function GET(req: NextRequest) {
  try {
    const session = await SovereignAuthService.getSession(req);

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        session: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        email: session.email,
        isAdmin: session.isAdmin,
      },
    });

  } catch (error: any) {
    console.error('[DealSigning Auth API] Error resolving session:', error);
    return NextResponse.json({
      authenticated: false,
      session: null,
    });
  }
}
