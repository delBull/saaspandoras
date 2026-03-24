import { NextResponse } from "next/server";
import { db } from "~/db";
import { accessRequests } from "~/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public endpoint — no auth required.
// Called from: nextjs /api/waitlist, dashboard /access page, any future surface.
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      email?: string;
      walletAddress?: string;
      intent?: string;
      source?: string;
      metadata?: Record<string, unknown>;
    };

    const { email, walletAddress, intent, source, metadata } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    // Check for duplicate — if same email already requested, update metadata but don't dupe
    const existing = await db.query.accessRequests.findFirst({
      where: eq(accessRequests.email, email.toLowerCase().trim()),
    });

    if (existing) {
      // Update wallet if provided now and wasn't before
      if (walletAddress && !existing.walletAddress) {
        await db
          .update(accessRequests)
          .set({ walletAddress, metadata: { ...(existing.metadata as object || {}), ...(metadata || {}) } })
          .where(eq(accessRequests.id, existing.id));
      }
      return NextResponse.json({ success: true, existing: true });
    }

    await db.insert(accessRequests).values({
      email: email.toLowerCase().trim(),
      walletAddress: walletAddress || null,
      intent: intent || null,
      source: source || "unknown",
      status: "pending",
      metadata: metadata || null,
    });

    console.log(`✅ [access-requests] New: ${email} | source: ${source || "unknown"} | intent: ${intent || "-"}`);

    // ── Fire Growth Engine via track-event (fire-and-forget) ─────────────────
    // track-event handles lead lookup/creation automatically
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3001";
    fetch(`${baseUrl}/api/gamification/track-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "waitlist_signup",
        metadata: { email: email.toLowerCase().trim(), intent: intent || "unknown", source: source || "unknown" },
      }),
    }).catch((e: unknown) => console.error("[access-requests] track-event:", e));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/access-requests]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Admin GET — list all pending requests (add auth guard in future)
export async function GET() {
  try {
    const all = await db.query.accessRequests.findMany({
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    return NextResponse.json(all);
  } catch (err) {
    console.error("[/api/access-requests GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
