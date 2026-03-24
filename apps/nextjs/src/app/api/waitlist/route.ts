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
    };

    const { email, wallet, intent } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    const dashboardUrl =
      process.env.NEXT_PUBLIC_DASHBOARD_URL ??
      process.env.DASHBOARD_API_URL ??
      "https://dashboard.pandoras.finance";

    const res = await fetch(`${dashboardUrl}/api/access-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        walletAddress: wallet || null,
        intent: intent || null,
        source: "landing_v2_nextjs",
        metadata: {
          referrer: request.headers.get("referer") ?? null,
          userAgent: request.headers.get("user-agent") ?? null,
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
