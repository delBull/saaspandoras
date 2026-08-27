import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/deal-signing/auth/logout
 * Logs out user by clearing the session cookie
 */
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Sesión cerrada exitosamente.',
  });

  response.cookies.delete('__sovereign_sign_session');
  return response;
}
