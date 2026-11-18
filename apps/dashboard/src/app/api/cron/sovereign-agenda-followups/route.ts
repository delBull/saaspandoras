import { NextRequest, NextResponse } from 'next/server';
import { runSovereignFollowUps } from '@/lib/nexus/agenda-followups';

/**
 * Red de seguridad del seguimiento post-presentación.
 *
 * El disparador principal es `POST /api/v1/meet/end` (inmediato, al cerrar la sala).
 * Este cron reintenta lo que quedó `pending` (por ejemplo si el email falló por
 * configuración o por rate limit) y cubre reuniones cerradas por otras vías.
 *
 * Autenticación: `Authorization: Bearer $CRON_SECRET` (Vercel Cron lo envía solo
 * cuando CRON_SECRET existe en el proyecto). Fail-closed en producción.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const summary = await runSovereignFollowUps();
    console.log('[Sovereign Agenda] Follow-up cron:', summary);
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error('[Sovereign Agenda] Cron Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
