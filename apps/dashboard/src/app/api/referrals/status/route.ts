import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { db } from "@/db";
import { userReferrals } from "@/db/schema";
import { eq } from "drizzle-orm";

// Endpoint GET para verificar estado de referidos del usuario actual
export async function GET(_request: Request) {
  try {
    const { session } = await getAuth(await headers());
    const walletAddress = session?.address ?? session?.userId;

    if (!walletAddress) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const userWallet = walletAddress.toLowerCase();

    // Buscar si el usuario fue referido por alguien
    const userReferral = await db.query.userReferrals.findFirst({
      where: eq(userReferrals.referredWalletAddress, userWallet),
      columns: {
        referrerWalletAddress: true,
        status: true,
        referralSource: true,
        completedAt: true,
        referredCompletedOnboarding: true,
        referredFirstProject: true
      }
    });

    return NextResponse.json({
      wasReferred: !!userReferral,
      referrer: userReferral?.referrerWalletAddress ?? null,
      status: userReferral?.status ?? null,
      source: userReferral?.referralSource ?? null,
      completedOnboarding: userReferral?.referredCompletedOnboarding ?? false,
      hasFirstProject: userReferral?.referredFirstProject ?? false,
      completedAt: userReferral?.completedAt ?? null
    });

  } catch (error) {
    console.error("Error fetching referral status:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
