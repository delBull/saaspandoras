import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { db } from "~/db";
import { userReferrals as referralsTable } from "@/db/schema";
import { eq, count, sql } from "drizzle-orm";

// API para obtener información de referidos personales
export async function GET() {
  try {
    const { session } = await getAuth(await headers());
    const walletAddress = session?.address?? session?.userId;

    if (!walletAddress) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const userWallet = walletAddress.toLowerCase();

    // Obtener estadísticas de referidos
    const referralStats = await db
      .select({
        totalReferrals: count(),
        completedReferrals: sql<number>`count(case when status = 'completed' then 1 end)`,
        pendingReferrals: sql<number>`count(case when status = 'pending' then 1 end)`,
      })
      .from(referralsTable)
      .where(eq(referralsTable.referrerWalletAddress, userWallet));

    // Obtener lista reciente de referidos (últimos 5)
    const recentReferrals = await db
      .select({
        id: referralsTable.id,
        referredWalletAddress: referralsTable.referredWalletAddress,
        status: referralsTable.status,
        referralSource: referralsTable.referralSource,
        createdAt: referralsTable.createdAt,
        completedAt: referralsTable.completedAt,
        referredFirstProject: referralsTable.referredFirstProject,
        referredCompletedOnboarding: referralsTable.referredCompletedOnboarding
      })
      .from(referralsTable)
      .where(eq(referralsTable.referrerWalletAddress, userWallet))
      .orderBy(sql`${referralsTable.createdAt} desc`)
      .limit(5);

    // Generar enlace personalizado
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const referralLink = `${baseUrl}/join?ref=${userWallet}`;

    return NextResponse.json({
      referralLink,
      stats: referralStats[0],
      recentReferrals,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}`
    });

  } catch (error) {
    console.error("Error fetching referral data:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
