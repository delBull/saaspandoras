import { NextResponse } from 'next/server';

/**
 * B12: Internal API Authorization Guard
 * 
 * All /api/v1/internal/* endpoints MUST call this before doing any work.
 * Validates the PANDORAS_INTERNAL_API_SECRET header to prevent unauthorized
 * access from external clients.
 * 
 * Usage:
 *   const authError = requireInternalAuth(req);
 *   if (authError) return authError;
 */
export function requireInternalAuth(req: Request): NextResponse | null {
  const internalSecret = process.env.PANDORAS_INTERNAL_API_SECRET;
  
  // If no secret is configured, only allow in development
  if (!internalSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[InternalAuth] PANDORAS_INTERNAL_API_SECRET is not set in production. Denying request.');
      return NextResponse.json(
        { error: 'Internal API is not configured for external access.' },
        { status: 503 }
      );
    }
    // Dev mode: allow without secret (log a warning)
    console.warn('[InternalAuth] No PANDORAS_INTERNAL_API_SECRET set. Allowing in development mode.');
    return null;
  }

  const providedSecret = req.headers.get('x-pandoras-internal-secret');
  
  if (!providedSecret || providedSecret !== internalSecret) {
    console.warn(`[InternalAuth] Unauthorized access attempt to internal API from ${req.headers.get('x-forwarded-for') || 'unknown'}`);
    return NextResponse.json(
      { error: 'Unauthorized. Internal API access requires valid secret.' },
      { status: 401 }
    );
  }

  return null; // Auth passed
}
