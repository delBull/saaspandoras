import { NextRequest, NextResponse } from "next/server";
import { runMeetingReminders } from "@/lib/nexus/meeting-reminders";
import { reapStaleLiveMeetings } from "@/lib/nexus/meeting-reaper";

/**
 * Recordatorios de reunión: 24 h y 1 h antes.
 *
 * Se dispara desde GitHub Actions cada 15 minutos (no desde Vercel Cron: el plan
 * Hobby solo permite cron diario). Es idempotente por participante: si el correo ya
 * salió, la columna `reminder_*_sent_at` lo marca y no se repite.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Higiene: cierra reuniones `live` colgadas antes de calcular recordatorios.
    let reaped = 0;
    try {
      reaped = (await reapStaleLiveMeetings()).reaped;
    } catch (reaperError) {
      console.error("[MeetingReminders] Reaper error:", reaperError);
    }

    const summary = await runMeetingReminders();
    console.log("[MeetingReminders] cron:", summary, "reaped:", reaped);
    return NextResponse.json({ success: true, reaped, ...summary });
  } catch (error) {
    console.error("[MeetingReminders] Cron Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
