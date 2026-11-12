import { NextRequest, NextResponse } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db';
import { meetingPresentationState } from '@saasfly/db/schema';
import { eq } from '@saasfly/db-core';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * /api/v1/meet/[meetingId]/presentation
 *
 * Sincronización del deck dentro de la reunión:
 *  - GET  (público): devuelve el slide actual → los invitados lo siguen por polling.
 *  - POST (host con sesión de Nexus): publica el slide actual.
 *
 * No es WebRTC: es un estado compartido (idempotente, sin secretos).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  if (!meetingId) return NextResponse.json({ ok: false, error: 'meetingId requerido' }, { status: 400 });

  const [state] = await db
    .select()
    .from(meetingPresentationState)
    .where(eq(meetingPresentationState.meetingId, meetingId))
    .limit(1);

  return NextResponse.json({
    ok: true,
    meetingId,
    slideIndex: state?.slideIndex ?? 0,
    presentationId: state?.presentationId ?? null,
    updatedAt: state?.updatedAt ?? null,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  const headers = await import('next/headers').then((m) => m.headers());
  const auth = await getNexusAuthContext(headers);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ ok: false, error: 'Sesión de Nexus requerida (host)' }, { status: 401 });
  }

  let body: { slideIndex?: unknown; presentationId?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 });
  }

  const slideIndex = Number(body.slideIndex);
  const presentationId = typeof body.presentationId === 'string' ? body.presentationId : 'celeste';
  if (!Number.isInteger(slideIndex) || slideIndex < 0) {
    return NextResponse.json({ ok: false, error: 'slideIndex inválido' }, { status: 422 });
  }

  await db
    .insert(meetingPresentationState)
    .values({
      meetingId,
      presentationId,
      slideIndex,
      updatedBy: auth.email ?? auth.wallet ?? 'host',
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: meetingPresentationState.meetingId,
      set: { slideIndex, presentationId, updatedBy: auth.email ?? auth.wallet ?? 'host', updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true, meetingId, slideIndex, presentationId });
}
