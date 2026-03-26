import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy waitlist submissions to the single source of truth:
 * dashboard /api/access-requests
 *
 * This means all leads — whether they come from /v2/waitlist (nextjs)
 * or from the dashboard Genesis page — end up in one table.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      email?: string;
      wallet?: string;
      intent?: string;
      metadata?: Record<string, any>;
    };

    const { email, wallet, intent } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    // 🌍 Multi-Environment URL Resolution
    const host = request.headers.get("host") || "";
    const isStaging = host.includes("staging") || host.includes("vercel.app");
    
    const defaultProd = "https://dash.pandoras.finance";
    const defaultStaging = "https://staging.dash.pandoras.finance";

    const dashboardUrl =
      process.env.NEXT_PUBLIC_DASHBOARD_URL ??
      process.env.DASHBOARD_API_URL ??
      (isStaging ? defaultStaging : (process.env.NODE_ENV === 'development' ? "http://localhost:3000" : defaultProd));

    // 🧬 Phase 87: Unified Growth Engine Event Dispatch
    const res = await fetch(`${dashboardUrl}/api/v1/marketing/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: 'VIEW_ACCESS',
        projectSlug: 'pandoras_access', // Unified catch-all for this landing
        metadata: {
          email: email.toLowerCase(),
          wallet: wallet || null,
          intent: intent || 'explore',
          source: "landing_v2_nextjs",
          referrer: request.headers.get("referer") ?? null,
          userAgent: request.headers.get("user-agent") ?? null,
          ...body.metadata,
        },
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("[/api/waitlist proxy] Dashboard error:", errData);
      // Still return success to not expose internals
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/waitlist]", err);
    // Fail gracefully
    return NextResponse.json({ success: true });
  }
}
