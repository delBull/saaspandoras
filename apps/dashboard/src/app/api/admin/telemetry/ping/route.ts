import { NextResponse } from 'next/server';
import { TelemetryService } from '@/lib/security/telemetry';
import { validateAdminSession } from '@/lib/admin-auth';

export async function POST(req: Request) {
  try {
    const { errorResponse } = await validateAdminSession(req.headers);
    if (errorResponse) {
      return errorResponse;
    }

    // Since sendAlert is async and fire-and-forget, we can just call it
    TelemetryService.sendAlert(
      'System Ping',
      'El canal de telemetría segura está activo y funcionando correctamente.',
      'INFO',
      {
        timestamp: new Date().toISOString(),
        triggeredBy: 'Admin Settings Panel'
      }
    );

    return NextResponse.json({ success: true, message: 'Ping sent successfully' });
  } catch (error) {
    console.error("[Telemetry Ping Error]", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
