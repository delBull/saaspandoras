import { db } from '@/db';
import { userReferrals, users, projects, userAchievements, achievements } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Update referral progress for a user
 * This function checks if a referred user has completed actions that trigger referral bonuses
 */
export async function updateReferralProgress(walletAddress: string) {
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

    // Si acaba de completar el referido (cualquiera de las acciones), marcar como completado
    // Los puntos y achievements se otorgan desde el servicio de gamificación
    if ((hasCompletedOnboarding || hasFirstProject || hasUnlockedAchievements) && referral.status === 'pending') {
      console.log(`🎉 Referral completed for user: ${userWallet.slice(0, 6)}...`);
      // Los puntos se otorgan desde el servicio de gamificación que llama a esta función
    }

    console.log(`✅ Referral progress updated for ${userWallet.slice(0, 6)}...: onboarding=${hasCompletedOnboarding}, project=${hasFirstProject}, achievements=${hasUnlockedAchievements}, status=${(hasCompletedOnboarding || hasFirstProject || hasUnlockedAchievements) ? 'completed' : 'pending'}`);

  } catch (error) {
    console.error('Error updating referral progress:', error);
  }
}
