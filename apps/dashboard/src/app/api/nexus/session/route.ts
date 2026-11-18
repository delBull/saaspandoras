import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rotateCollaboratorSessionToken } from '@saasfly/hermes-core';
import { authRateLimiter, getTrustedClientIp } from '@saasfly/shared';

/**
 * POST /api/nexus/session
 *
 * Canjea un token de magic link por una cookie de sesión `httpOnly`.
 *
 * Por qué existe:
 *  - El token del magic link es un bearer de un solo uso: si se queda como cookie
 *    de sesión (como antes), un enlace filtrado sirve para entrar durante 24 h,
 *    incluso después de cerrar sesión. Aquí se quema al canjearlo y se emite uno
 *    nuevo que JavaScript nunca ve.
 *  - Un POST (no el GET del enlace) evita que los escáneres de correo que
 *    pre-abren enlaces consuman el token antes de que el operador haga clic.
 *
 * Respuestas: 200 `{ ok: true }` (cookie establecida) · 400 sin token ·
 * 401 token no canjeable (inválido, expirado, ya usado, revocado) · 429 límite.
 */
const SESSION_TTL_HOURS = 24;
const SESSION_COOKIE = 'pandoras_nexus_token';

export async function POST(req: NextRequest) {
  const ip = getTrustedClientIp(req.headers);
  if (!(await authRateLimiter.isAllowed(`nexus-session-exchange:ip:${ip}`))) {
    return NextResponse.json(
      { ok: false, error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
      { status: 429 }
    );
  }

  let payload: unknown = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }
  const bodyToken =
    payload !== null && typeof payload === 'object'
      ? (payload as Record<string, unknown>).token
      : undefined;

  const presented =
    (typeof bodyToken === 'string' && bodyToken.trim() ? bodyToken.trim() : '') ||
    (req.headers.get('x-nexus-token') ?? '').trim();

  if (!presented) {
    return NextResponse.json({ ok: false, error: 'Token requerido.' }, { status: 400 });
  }

  let rotated: Awaited<ReturnType<typeof rotateCollaboratorSessionToken>>;
  try {
    rotated = await rotateCollaboratorSessionToken(presented, { ttlHours: SESSION_TTL_HOURS });
  } catch (error: unknown) {
    // Fail-closed: sin rotación no hay sesión. Nunca se emite cookie a medias.
    console.error('[Nexus Session] Token rotation failed:', error);
    return NextResponse.json({ ok: false, error: 'No se pudo establecer la sesión.' }, { status: 500 });
  }

  if (!rotated) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, rotated.sessionToken, {
    httpOnly: true,
    path: '/',
    maxAge: SESSION_TTL_HOURS * 60 * 60,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  // Cualquier copia legacy legible por JS deja de ser aceptada como sesión.
  response.cookies.set('nexus_token', '', { path: '/', maxAge: 0 });
  return response;
}
