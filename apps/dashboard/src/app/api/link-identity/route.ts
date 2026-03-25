import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accessRequests, marketingLeads, marketingIdentities } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/link-identity
 * ============================================================================
 * Bridges the gap between a captured email lead and a connected wallet.
 * This is the "Identity Linking" bridge recommended for production hardening.
 * 
 * Payload: { email: string, walletAddress: string }
 * Returns: { success: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, walletAddress } = await request.json() as { email?: string; walletAddress?: string };

    if (!email || !walletAddress) {
      return NextResponse.json({ error: "Missing identity data" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanWallet = walletAddress.toLowerCase().trim();

    console.log(`🔗 [link-identity] Bridging ${cleanEmail} <-> ${cleanWallet}`);

    // 1. Update Legacy Access Requests
    await db.update(accessRequests)
      .set({ walletAddress: cleanWallet })
      .where(and(
        eq(accessRequests.email, cleanEmail),
        // Only update if currently null to avoid overwriting or redundant ops
        // (Actually, if it's the same, no harm. If it's different, we prioritize the new one)
      ));

    // 2. Update Growth OS Identity
    const identity = await db.query.marketingIdentities.findFirst({
      where: eq(marketingIdentities.email, cleanEmail)
    });

    if (identity) {
      await db.update(marketingIdentities)
        .set({ walletAddress: cleanWallet })
        .where(eq(marketingIdentities.id, identity.id));
      
      // 3. Update all Leads for this Identity
      await db.update(marketingLeads)
        .set({ walletAddress: cleanWallet })
        .where(eq(marketingLeads.identityId, identity.id));
      
      console.log(`✅ [link-identity] Identity & Leads updated for ${cleanEmail}`);
    } else {
        // If identity doesn't exist by email, we don't create it here (handled by capture)
        console.warn(`⚠️ [link-identity] No identity found for ${cleanEmail}. Skipping Growth OS link.`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ [api/link-identity] Failed to link:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
