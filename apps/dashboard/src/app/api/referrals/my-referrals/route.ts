import { NextResponse } from "next/server";
import { db } from "~/db";
import { userReferrals } from "@/db/schema";
import { eq } from "drizzle-orm";

// Endpoint GET para obtener referidos de un referrer
// /api/referrals/my-referrals?wallet=<wallet_address>
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ message: "Wallet address requerida" }, { status: 400 });
    }

    const referrerWallet = wallet.toLowerCase();

    // Obtener todos los referidos de este referrer
    const referrals = await db
      .select()
      .from(userReferrals)
      .where(eq(userReferrals.referrerWalletAddress, referrerWallet))
      .orderBy(userReferrals.createdAt);

    console.log(`✅ Found ${referrals.length} referrals for referrer ${referrerWallet.slice(0, 6)}...`);

    return NextResponse.json({
      referrals: referrals.map(referral => ({
        id: referral.id.toString(),
        referrerWalletAddress: referral.referrerWalletAddress,
        referredWalletAddress: referral.referredWalletAddress,
        referralSource: referral.referralSource,
        status: referral.status,
        completedAt: referral.completedAt,
        referredCompletedOnboarding: referral.referredCompletedOnboarding,
        referredFirstProject: referral.referredFirstProject,
      })),
      count: referrals.length,
      success: true
    });

  } catch (error) {
    console.error("Error fetching referrals for referrer:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
