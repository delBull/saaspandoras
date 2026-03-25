import { NextResponse } from "next/server";
import { db } from "~/db";
import { accessRequests } from "~/db/schema";
import { eq } from "drizzle-orm";
import { sendWaitlistSequenceEmail } from "~/lib/marketing/growth-engine/email-senders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public endpoint — no auth required.
// Called from: nextjs /api/waitlist, dashboard /access page, any future surface.
function calculateSelectionScore(email: string, hasWallet: boolean, metadata?: any) {
  let score = 50;
  const normalizedEmail = email.toLowerCase();
  
  // 1. Keyword Boost (Anti-gaming: limit total boost)
  const keywords = ["fund", "capital", "invest", "yield", "alpha", "vc", "family"];
  const hasKeyword = keywords.some(k => normalizedEmail.includes(k));
  if (hasKeyword) score += 15;

  // 2. Technical Signal
  if (hasWallet) score += 10;

  // 3. Behavioral signals (from metadata)
  if (metadata?.timeOnPage > 60) score += 5;
  if (metadata?.returningUser) score += 5;

  // 4. Spam Penalty (Disposable domains)
  const disposable = ["tempmail.com", "10minutemail.com", "guerrillamail.com", "mailinator.com"];
  if (disposable.some(d => normalizedEmail.endsWith(d))) score -= 30;

  return Math.max(0, Math.min(score, 100));
}

function getApprovalDelay(score: number): number {
  const ms = 60 * 1000;
  if (score >= 85) return (Math.random() * 3 + 2) * ms;           // 2-5 min
  if (score >= 70) return (Math.random() * 20 + 10) * ms;        // 10-30 min
  if (score >= 50) return (Math.random() * 5 + 1) * 60 * ms;     // 1-6 hrs
  return (Math.random() * 10 + 2) * 60 * ms;                    // 2-12 hrs (optimized from 48h)
}

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

    const cleanEmail = email.toLowerCase().trim();

    // Check for duplicate
    const existing = await db.query.accessRequests.findFirst({
      where: eq(accessRequests.email, cleanEmail),
    });

    if (existing) {
      if (walletAddress && !existing.walletAddress) {
        await db
          .update(accessRequests)
          .set({ walletAddress, metadata: { ...(existing.metadata as object || {}), ...(metadata || {}) } })
          .where(eq(accessRequests.id, existing.id));
      }
      return NextResponse.json({ success: true, existing: true });
    }

    // ── PERCEIVED SELECTION ENGINE ──────────────────────────────────────────
    const score = calculateSelectionScore(cleanEmail, !!walletAddress, metadata);
    const delayMs = getApprovalDelay(score);
    const eligibleAt = new Date(Date.now() + delayMs);

    await db.insert(accessRequests).values({
      email: cleanEmail,
      walletAddress: walletAddress || null,
      intent: intent || null,
      source: source || "unknown",
      status: "pending",
      score: score,
      eligibleAt: eligibleAt,
      metadata: metadata || null,
    });

    console.log(`✅ [access-requests] Score: ${score} | EligibleAt: ${eligibleAt.toISOString()} | email: ${cleanEmail}`);

    // ── Email Step 1 ────────────────────────────────────────────────────────
    sendWaitlistSequenceEmail({ to: cleanEmail, step: 1 })
      .catch((e: unknown) => console.error(`[access-requests] Step 1 email failed:`, e));

    return NextResponse.json({ success: true, score });
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
