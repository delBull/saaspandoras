import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { db } from "@/db";
import { userReferrals, users, projects, userAchievements, achievements } from "@/db/schema";
import { GamificationService } from "@/lib/gamification/service";
import { eq, and } from "drizzle-orm";

// Función para actualizar el progreso de referidos
async function updateReferralProgress(walletAddress: string) {
  try {
    const userWallet = walletAddress.toLowerCase();

    // Buscar si este usuario fue referido por alguien
    const referral = await db.query.userReferrals.findFirst({
      where: eq(userReferrals.referredWalletAddress, userWallet),
      columns: {
        id: true,
        referrerWalletAddress: true,
        status: true,
        referredCompletedOnboarding: true,
        referredFirstProject: true
      }
    });

    if (!referral || referral.status === 'completed') {
      return; // No hay referral o ya está completado
    }

    // Verificar progreso del referido - obtener tanto KYC como ID
    const user = await db.query.users.findFirst({
      where: eq(users.walletAddress, userWallet),
      columns: {
        id: true,
        kycCompleted: true,
        kycLevel: true
      }
    });

    // Verificar si tiene al menos un proyecto aplicado
    const userProjects = await db.query.projects.findMany({
      where: eq(projects.applicantWalletAddress, userWallet),
      columns: { id: true },
      limit: 1
    });

    // Verificar si tiene achievements desbloqueados (además del "Primer Login")
    const userAchievementRecords = await db.query.userAchievements.findMany({
      where: eq(userAchievements.userId, user?.id?.toString() ?? '0'),
      columns: { achievementId: true, isUnlocked: true }
    });

    // Buscar el achievement "Primer Login" para excluirlo
    const primerLoginAchievement = await db.query.achievements.findFirst({
      where: eq(achievements.name, 'Primer Login'),
      columns: { id: true }
    });

    // Contar achievements desbloqueados excluyendo "Primer Login"
    const unlockedAchievementsExcludingLogin = userAchievementRecords.filter(
      (ua: { achievementId: number; isUnlocked: boolean }) => ua.isUnlocked &&
           (!primerLoginAchievement || ua.achievementId !== primerLoginAchievement.id)
    ).length;

    const hasCompletedOnboarding = (user?.kycCompleted ?? false) && user?.kycLevel === 'basic';
    const hasFirstProject = userProjects.length > 0;
    const hasUnlockedAchievements = unlockedAchievementsExcludingLogin > 0;

    // Si ya tenía estos valores, no actualizar
    if (referral.referredCompletedOnboarding === hasCompletedOnboarding &&
        referral.referredFirstProject === hasFirstProject) {
      return;
    }

    // Actualizar progreso
    await db
      .update(userReferrals)
      .set({
        referredCompletedOnboarding: hasCompletedOnboarding,
        referredFirstProject: hasFirstProject,
        // Si completó al menos una acción importante (KYC, proyecto o achievement), marcar como completed
        status: (hasCompletedOnboarding || hasFirstProject || hasUnlockedAchievements) ? 'completed' : 'pending',
        completedAt: (hasCompletedOnboarding || hasFirstProject || hasUnlockedAchievements) ? new Date() : null
      })
      .where(eq(userReferrals.referredWalletAddress, userWallet));

    // Si acaba de completar el referido (cualquiera de las acciones), otorgar puntos adicionales al referrer
    if ((hasCompletedOnboarding || hasFirstProject || hasUnlockedAchievements) && referral.status === 'pending') {
      try {
        await GamificationService.trackEvent(
          referral.referrerWalletAddress,
          'referral_completed', // Evento especial para referido completado
          {
            referredWallet: userWallet,
            completionBonus: 100, // Bonus adicional por referido completado
            completedOnboarding: hasCompletedOnboarding,
            completedFirstProject: hasFirstProject,
            completedAchievement: hasUnlockedAchievements,
            completionType: hasCompletedOnboarding && hasFirstProject && hasUnlockedAchievements ? 'all' :
                           hasCompletedOnboarding && hasFirstProject ? 'onboarding_project' :
                           hasCompletedOnboarding && hasUnlockedAchievements ? 'onboarding_achievement' :
                           hasFirstProject && hasUnlockedAchievements ? 'project_achievement' :
                           hasCompletedOnboarding ? 'onboarding_only' :
                           hasFirstProject ? 'project_only' : 'achievement_only'
          }
        );
        console.log(`🎉 Referral completion bonus awarded to referrer: ${referral.referrerWalletAddress.slice(0, 6)}... (+100 points)`);

        // 🎯 DESBLOQUEAR ACHIEVEMENT: Otorgar achievement "Referido Completado" al referido
        try {
          // Importar dinámicamente para evitar dependencias circulares
          const { GamificationService } = await import('@/lib/gamification/service');
          await GamificationService.triggerAchievementUnlock(userWallet, 'referral_completed', 0);
          console.log(`🏆 Achievement "Referido Completado" unlocked for referred user: ${userWallet.slice(0, 6)}...`);
        } catch (achievementError) {
          console.warn('⚠️ Failed to unlock referral completed achievement:', achievementError);
          // No bloquear el proceso si falla el achievement
        }
      } catch (gamificationError) {
        console.warn('⚠️ Failed to award referral completion bonus:', gamificationError);
      }
    }

    console.log(`✅ Referral progress updated for ${userWallet.slice(0, 6)}...: onboarding=${hasCompletedOnboarding}, project=${hasFirstProject}, achievements=${hasUnlockedAchievements}, status=${(hasCompletedOnboarding || hasFirstProject || hasUnlockedAchievements) ? 'completed' : 'pending'}`);

  } catch (error) {
    console.error('Error updating referral progress:', error);
  }
}

// Export the function for use in other modules
export { updateReferralProgress };

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
      console.log(`🎉 Referral reward event tracked for referrer: ${referrerWalletNormalized.slice(0, 6)}... (+200 points)`);
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
