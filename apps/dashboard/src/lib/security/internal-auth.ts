import { timingSafeEqual } from 'node:crypto';
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

/**
 * Autorización para tareas programadas (Vercel Cron).
 *
 * Vercel envía `Authorization: Bearer <CRON_SECRET>` cuando esa variable existe.
 * Se acepta también el header interno (`x-pandoras-internal-secret`) para
 * disparos manuales desde operación.
 *
 * Fail-closed: sin `CRON_SECRET` configurado en producción ⇒ 503.
 */
export function requireCronAuth(req: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[CronAuth] CRON_SECRET no configurado en producción. Denegando.');
      return NextResponse.json(
        { error: 'Cron is not configured. Set CRON_SECRET.' },
        { status: 503 },
      );
    }
    return requireInternalAuth(req);
  }

  const header = req.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const provided = match?.[1]?.trim() ?? '';

  if (provided.length > 0) {
    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(cronSecret, 'utf8');
    if (a.length === b.length && timingSafeEqual(a, b)) return null;
  }

  // Disparo manual desde operación (mismo secreto interno ya existente).
  return requireInternalAuth(req);
}
