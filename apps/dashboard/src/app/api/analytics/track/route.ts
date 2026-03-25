import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, data } = body;

    // 🕊️ Silent Telemetry: Log ritual milestones for conversion monitoring
    console.log(`[ALEMBIC] 🏛️ Ritual Metric: ${event}`, data || "");

    // In a real production environment, you would send this to Mixpanel, PostHog, or a DB.
    // For now, we log to stdout to verify the flow in Vercel logs/Bun console.

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
