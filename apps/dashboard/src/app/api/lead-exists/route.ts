import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accessRequests, marketingLeads, marketingIdentities } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/lead-exists
 * ============================================================================
 * Lightweight endpoint to check if a visitor is already a known lead.
 * Used by NFTGate as a cross-device fallback when localStorage is missing.
 *
 * Query params (at least one required):
 *   ?email=user@example.com
 *   ?wallet=0xABC...
 *
 * Returns: { exists: boolean }
 * Public — no auth required. Returns no PII.
 */
export async function GET(request: NextRequest) {
  // EDGE CASE 3: Basic bot/scraper protection
  // Block headless agents and empty user-agents to prevent DB probing
  const ua = request.headers.get("user-agent") || "";
  if (!ua || ua.trim().length < 8) {
    return NextResponse.json({ exists: false });
  }

  // Require at least one valid identifier — no fishing queries
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.toLowerCase().trim();
  const wallet = searchParams.get("wallet")?.toLowerCase().trim();

  if (!email && !wallet) {
    return NextResponse.json({ exists: false });
  }

  // Minimal format guard — rejects obviously malformed inputs before hitting DB
  if (email && !email.includes("@")) {
    return NextResponse.json({ exists: false });
  }
  // MICRO EDGE 3: Proper wallet format — not just startsWith("0x")
  // Rejects 0xLOL, 0x123, etc. before any DB cost
  if (wallet && !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ exists: false });
  }

  try {
    // Check accessRequests table (primary lead table)
    const conditions = [];
    if (email) conditions.push(eq(accessRequests.email, email));
    if (wallet) conditions.push(eq(accessRequests.walletAddress, wallet));

    const existing = await db.query.accessRequests.findFirst({
      where: conditions.length === 1 ? conditions[0] : or(...conditions),
      columns: { id: true },
    });

    if (existing) {
      return NextResponse.json({ exists: true });
    }

    // Fallback: check marketingIdentities (Growth OS)
    const identityConditions = [];
    if (email) identityConditions.push(eq(marketingIdentities.email, email));
    if (wallet) identityConditions.push(eq(marketingIdentities.walletAddress, wallet));

    const identity = await db.query.marketingIdentities.findFirst({
      where: identityConditions.length === 1 ? identityConditions[0] : or(...identityConditions),
      columns: { id: true },
    });

    return NextResponse.json({ exists: !!identity });

  } catch (err) {
    console.error("[/api/lead-exists]", err);
    // Fail open — don't block the user if DB check fails
    return NextResponse.json({ exists: false });
  }
}
