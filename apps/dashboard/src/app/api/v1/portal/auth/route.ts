import { NextResponse } from 'next/server';
import { consumePortalToken, validatePortalSession } from '@saasfly/shared';
import { OrganizationSDK } from '@saasfly/shared';

const PORTAL_SESSION_COOKIE = 'pandoras_portal_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const session = await consumePortalToken(token);
    const organization = await OrganizationSDK.resolve(session.projectId, session.product as any);

    const response = NextResponse.json({
      sessionToken: session.sessionToken,
      organization,
    });

    // La sesión se fija en el servidor (HttpOnly): antes la escribía el navegador
    // con `document.cookie`, así que cualquier fallo del cliente (JS bloqueado,
    // recarga a media escritura) dejaba al usuario sin sesión al refrescar.
    response.cookies.set({
      name: PORTAL_SESSION_COOKIE,
      value: session.sessionToken,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    console.error('[Portal Auth API Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Authentication failed' },
      { status: 401 }
    );
  }
}

/** Comprueba si la cookie actual sigue siendo válida (para no pedir login de más). */
export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${PORTAL_SESSION_COOKIE}=([^;]+)`));
  if (!match?.[1]) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const session = await validatePortalSession(decodeURIComponent(match[1]));
  return NextResponse.json(
    { authenticated: Boolean(session), projectId: session?.projectId ?? null },
    { status: 200 },
  );
}
