import { NextRequest, NextResponse } from 'next/server';
import { SovereignAuthService } from '@/lib/deal-signing/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/deal-signing/auth/verify
 * Verifies Magic Link token and issues persistent session cookie
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body.token as string | undefined;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'MISSING_TOKEN', message: 'Token de acceso requerido.' },
        { status: 400 }
      );
    }

    const email = await SovereignAuthService.verifyMagicLinkToken(token);
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'INVALID_TOKEN', message: 'El enlace de acceso ha expirado o es inválido.' },
        { status: 401 }
      );
    }

    const sessionToken = await SovereignAuthService.generateSessionToken(email);
    const isAdmin = SovereignAuthService.checkIsAdmin(email);

    const response = NextResponse.json({
      success: true,
      session: { email, isAdmin },
      token: sessionToken,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set('__sovereign_sign_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 14 * 24 * 60 * 60, // 14 days
    });

    return response;

  } catch (error: any) {
    console.error('[DealSigning Auth API] Error verifying token:', error);
    return NextResponse.json(
      { success: false, error: 'VERIFICATION_FAILED', message: error?.message || 'Error al verificar token' },
      { status: 500 }
    );
  }
}
