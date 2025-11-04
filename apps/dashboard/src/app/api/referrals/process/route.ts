import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { db } from "@/db";
import { userReferrals, users } from "@/db/schema";
import { GamificationService } from "@/lib/gamification/service";
import { eq, and } from "drizzle-orm";

// Re-export the function from server-utils for backward compatibility
export { updateReferralProgress } from "@/lib/server-utils";

// API para procesar referidos desde enlaces ?ref=wallet
export async function POST(request: Request) {
  try {
    // Get wallet address from headers (set by client)
    let walletAddress = request.headers.get('x-wallet-address') ??
                       request.headers.get('x-thirdweb-address') ??
                       request.headers.get('x-user-address');

    // Also check session as fallback
    if (!walletAddress) {
      const { session } = await getAuth(request.headers);
      walletAddress = session?.address ?? session?.userId;
    }

    if (!walletAddress) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { referrerWallet, source = 'direct' } = body;

    // Validate and normalize source
    const validSources = ['direct', 'link', 'code', 'social'];
    const normalizedSource = validSources.includes(source) ? source : 'direct';

    if (!referrerWallet || typeof referrerWallet !== 'string') {
      return NextResponse.json({ message: "Wallet del referrer requerida" }, { status: 400 });
    }

    const currentUserWallet = walletAddress.toLowerCase();
    const referrerWalletNormalized = referrerWallet.toLowerCase();

    // Verificar que el referrer no sea el mismo usuario
    if (currentUserWallet === referrerWalletNormalized) {
      return NextResponse.json({ message: "No puedes referirte a ti mismo" }, { status: 400 });
    }

    // Verificar que el referrer existe en la base de datos
    const referrerExists = await db.query.users.findFirst({
      where: eq(users.walletAddress, referrerWalletNormalized),
      columns: { id: true }
    });

    if (!referrerExists) {
      return NextResponse.json({ message: "Referrer no encontrado" }, { status: 404 });
    }

    // Verificar si ya existe este referido
    const existingReferral = await db.query.userReferrals.findFirst({
      where: and(
        eq(userReferrals.referrerWalletAddress, referrerWalletNormalized),
        eq(userReferrals.referredWalletAddress, currentUserWallet)
      )
    });

    if (existingReferral) {
      return NextResponse.json({
        message: "Ya fuiste referido por este usuario",
        alreadyReferred: true
      });
    }

    // Crear el referido
    await db.insert(userReferrals).values({
      referrerWalletAddress: referrerWalletNormalized,
      referredWalletAddress: currentUserWallet,
      referralSource: normalizedSource,
      status: 'pending'
    });

    // Trigger evento inicial de referido (50 puntos al referido por unirse)
    try {
      await GamificationService.trackEvent(
        currentUserWallet,
        'DAILY_LOGIN', // Reutilizando evento de login para el referido
        {
          eventSubtype: 'referral_joined',
          referrerWallet: referrerWalletNormalized,
          source,
          referralBonus: 50
        }
      );
      console.log(`✅ Referral joined event tracked for new user: ${currentUserWallet.slice(0, 6)}...`);
    } catch (gamificationError) {
      console.warn('⚠️ Failed to track referral joined event:', gamificationError);
    }

    // 📈 Trigger evento para el REFERER (200 puntos por atraer referido)
    try {
      await GamificationService.trackEvent(
        referrerWalletNormalized,
        'referral_made', // Usar evento configurado en getEventPoints
        {
          eventSubtype: 'referrer_reward',
          referredWallet: currentUserWallet,
          source,
          referralBonus: 200, // 200 puntos para quien refirió
          referredBy: referrerWalletNormalized
        }
      );
      console.log(`� Referral reward event tracked for referrer: ${referrerWalletNormalized.slice(0, 6)}... (+200 points)`);
    } catch (gamificationError) {
      console.warn('⚠️ Failed to track referral reward for referrer:', gamificationError);
    }

    return NextResponse.json({
      message: "Referido procesado exitosamente",
      referralBonus: 50,
      success: true
    });

  } catch (error) {
    console.error("Error processing referral:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

// Endpoint GET para verificar estado de referidos
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
