import { NextRequest, NextResponse } from 'next/server';
import { runFollowUpReminders, runSovereignFollowUps } from '@/lib/nexus/agenda-followups';
import { reapStaleLiveMeetings } from '@/lib/nexus/meeting-reaper';

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
    // Reaper primero: una reunión live colgada no debe quedar viva ni disparar
    // correos (el reaper pone follow_up_enabled = false).
    let reaped = 0;
    try {
      reaped = (await reapStaleLiveMeetings()).reaped;
    } catch (reaperError) {
      console.error('[Sovereign Agenda] Reaper error:', reaperError);
    }

    const summary = await runSovereignFollowUps();

    // Paso 3: recordatorios programados desde el detalle de la reunión.
    let reminders = { due: 0, sent: 0, failed: 0 };
    try {
      reminders = await runFollowUpReminders();
    } catch (reminderError) {
      console.error('[Sovereign Agenda] Reminder error:', reminderError);
    }

    console.log('[Sovereign Agenda] Follow-up cron:', summary, 'reminders:', reminders, 'reaped:', reaped);
    return NextResponse.json({ success: true, reaped, reminders, ...summary });
  } catch (error) {
    console.error('[Sovereign Agenda] Cron Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
