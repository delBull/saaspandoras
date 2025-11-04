import type {
  UserGamificationProfile,
  UserAchievement,
  Reward,
  LeaderboardEntry,
  UserPoints,
  GamificationEvent,
  PointsCategory
} from '@pandoras/gamification';
import { GamificationEngine } from '@pandoras/gamification';
import { db } from '@/db';
import {
  gamificationProfiles,
  userPoints,
  achievements,
  rewards,
  users,
  userAchievements,
  projects,
  type GamificationProfile as DrizzleGamificationProfile
} from '@/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

// Export the class before declaring it
export class GamificationService {
  private static engine: GamificationEngine;
  // private static dbService: DatabaseService; // Commented out - using direct DB access instead

  constructor() {
    if (!GamificationService.engine) {
      GamificationService.engine = GamificationEngine.getInstance();
      // GamificationService.dbService = new DatabaseService(); // Commented out - using direct DB access instead
    }
  }

  /**
   * Get user gamification profile using real database
   */
  static async getUserProfile(walletAddress: string): Promise<UserGamificationProfile | null> {
    console.log(`🔍 GamificationService: Getting profile for wallet ${walletAddress}`);
    try {
      // First, find the user_id from users table using wallet_address
      const user = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.walletAddress, walletAddress))
        .limit(1);

      if (!user || user.length === 0 || !user[0]) {
        console.log(`❌ No user found for wallet address ${walletAddress}`);
        return null;
      }

      const userId = user[0].id;

      const dbProfile = await db
        .select()
        .from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, userId))
        .limit(1);

      if (dbProfile.length > 0 && dbProfile[0]) {
        const profile = this.mapDbProfileToGamificationProfile(dbProfile[0]);
        console.log(`✅ Profile found: Level ${profile.currentLevel}, ${profile.totalPoints} points`);
        return profile;
      }

      // Create new profile if doesn't exist
      console.log(`🆕 Creating new profile for wallet ${walletAddress} (user_id: ${userId})`);
      const newProfile = await this.createUserProfileInDb(walletAddress);
      return newProfile;
    } catch (error) {
      console.error(`❌ Error getting profile for wallet ${walletAddress}:`, error);
      return null;
    }
  }

  /**
   * Create new user profile in database
   */
  private static async createUserProfileInDb(userId: string): Promise<UserGamificationProfile> {
    // For demo purposes, use the userId as string to match User table structure

    const newDbProfile = {
      userId: userId,
      walletAddress: userId,
      totalPoints: 0,
      currentLevel: 1,
      levelProgress: 0,
      pointsToNextLevel: 100,
      projectsApplied: 0,
      projectsApproved: 0,
      totalInvested: "0.00",
      communityContributions: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      referralsCount: 0,
      communityRank: 0,
      reputationScore: 0,
      lastActivityDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const inserted = await db.insert(gamificationProfiles).values(newDbProfile).returning();
      if (inserted[0]) {
        return this.mapDbProfileToGamificationProfile(inserted[0]);
      }
      throw new Error('Failed to create profile - no data returned');
    } catch (error) {
      console.error(`❌ Error creating profile for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Map database profile to gamification profile
   */
  private static mapDbProfileToGamificationProfile(dbProfile: DrizzleGamificationProfile): UserGamificationProfile {
    return {
      id: dbProfile.id.toString(),
      userId: dbProfile.userId.toString(), // Convert number to string for frontend
      walletAddress: dbProfile.walletAddress,
      totalPoints: dbProfile.totalPoints,
      currentLevel: dbProfile.currentLevel,
      levelProgress: dbProfile.levelProgress,
      pointsToNextLevel: dbProfile.pointsToNextLevel,
      projectsApplied: dbProfile.projectsApplied,
      projectsApproved: dbProfile.projectsApproved,
      totalInvested: Number(dbProfile.totalInvested),
      communityContributions: dbProfile.communityContributions,
      currentStreak: dbProfile.currentStreak,
      longestStreak: dbProfile.longestStreak,
      lastActivityDate: dbProfile.lastActivityDate,
      totalActiveDays: dbProfile.totalActiveDays,
      referralsCount: dbProfile.referralsCount,
      communityRank: dbProfile.communityRank,
      reputationScore: dbProfile.reputationScore,
      createdAt: dbProfile.createdAt,
      updatedAt: dbProfile.updatedAt
    };
  }

  /**
   * Track gamification event using real database
   */
  static async trackEvent(
    userId: string,
    eventType: string,
    metadata?: Record<string, unknown>
  ): Promise<GamificationEvent> {
    console.log(`🎯 GamificationService: Tracking event ${eventType} for user ${userId}`);
    try {
      // Get points for this event type
      const points = this.getEventPoints(eventType);
      console.log(`💰 Event ${eventType} grants ${points} points`);

      // Award points directly using raw SQL (without events table dependency)
      let finalTotalPoints = 0;
      if (points > 0) {
        console.log(`🎯 Awarding ${points} points to user ${userId}`);

        // Get current points first to calculate final total
        const currentProfile = await db.execute(sql`
          SELECT total_points FROM gamification_profiles WHERE user_id = ${userId}
        `);
        const currentPoints = (currentProfile as any).rows?.[0]?.total_points ?? 0;
        finalTotalPoints = currentPoints + points;

        await db.execute(sql`
          UPDATE gamification_profiles
          SET
            total_points = total_points + ${points},
            current_level = GREATEST(1, FLOOR((total_points + ${points}) / 100) + 1),
            level_progress = ((total_points + ${points}) % 100),
            points_to_next_level = 100 - ((total_points + ${points}) % 100),
            updated_at = NOW()
          WHERE user_id = ${userId}
        `);

        // Insert points record
        await db.execute(sql`
          INSERT INTO user_points
          (user_id, points, reason, category, metadata, created_at)
          VALUES (${userId}, ${points}, ${`Event: ${eventType}`}, 'daily_login', ${JSON.stringify(metadata ?? {})}, NOW())
        `);
      }

      // 🚀 CHECK AND UNLOCK ACHIEVEMENTS AUTOMATICALLY
      await this.checkAndUnlockAchievements(userId, eventType, finalTotalPoints);

      console.log(`✅ Event tracked: +${points} points awarded to user ${userId}`);

      // Return basic event object (without ID dependency)
      return {
        id: `event_${Date.now()}_${userId}`,
        userId,
        type: 'daily_login' as any,
        category: 'daily' as any,
        points,
        metadata: metadata as any,
        createdAt: new Date()
      };
    } catch (error) {
      console.error(`❌ Error tracking event for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Award points using real engine
   */
  static async awardPoints(
    userId: string,
    points: number,
    reason: string,
    category: string,
    metadata?: Record<string, unknown>
  ): Promise<UserPoints> {
    console.log(`💎 GamificationService: Awarding ${points} points to user ${userId} for ${reason}`);
    try {
      const pointsRecord = await GamificationService.engine.awardPoints(
        userId,
        points,
        reason,
        category as PointsCategory,
        metadata
      );
      console.log(`✅ Points awarded:`, pointsRecord);
      return pointsRecord;
    } catch (error) {
      console.error(`❌ Error awarding points to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check and update referral progress for achievements
   * This ensures referral bonuses are awarded even for existing unlocked achievements
   */
  static async checkReferralProgressForAchievements(userId: string): Promise<void> {
    try {
      // Get user numeric ID
      const user = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.walletAddress, userId))
        .limit(1);

      if (!user || user.length === 0 || !user[0]) {
        return;
      }

      const userIdInt = user[0].id;

      // Check if user has any unlocked achievements (excluding "Primer Login")
      const primerLoginAchievement = await db.query.achievements.findFirst({
        where: eq(achievements.name, 'Primer Login'),
        columns: { id: true }
      });

      const unlockedAchievements = await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, userIdInt),
        columns: { achievementId: true, isUnlocked: true }
      });

      const hasUnlockedAchievementsExcludingLogin = unlockedAchievements.some(
        ua => ua.isUnlocked && (!primerLoginAchievement || ua.achievementId !== primerLoginAchievement.id)
      );

      if (hasUnlockedAchievementsExcludingLogin) {
        // Import and call updateReferralProgress
        const { updateReferralProgress } = await import('@/app/api/referrals/process/route');
        await updateReferralProgress(userId);
        console.log(`✅ Referral progress checked for existing achievements: ${userId.slice(0, 6)}...`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to check referral progress for achievements:', error);
    }
  }

  /**
   * Get user achievements using database
   */
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    console.log(`🏆 GamificationService: Getting achievements for user ${userId}`);
    try {
      // First, find the user_id from users table using wallet_address
      const user = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.walletAddress, userId))
        .limit(1);

      if (!user || user.length === 0 || !user[0]) {
        console.log(`❌ No user found for wallet address ${userId}`);

        // 🚀 CREATE PROFILE IF FIRST VISIT AND ENSURE BASIC ACHIEVEMENTS EXIST
        try {
          await this.getUserProfile(userId); // This will create profile if needed
          await this.initializeBasicAchievements(); // Ensure achievements exist
        } catch (error) {
          console.warn('⚠️ Failed to create profile/achievements on first access:', error);
        }
        return [];
      }

      const userIdInt = user[0].id;

      // Get user achievements with achievement details
      const userAchievementsData = await db
        .select({
          userAchievementId: userAchievements.id,
          achievementId: userAchievements.achievementId,
          progress: userAchievements.progress,
          isUnlocked: userAchievements.isUnlocked,
          unlockedAt: userAchievements.unlockedAt,
          name: achievements.name,
          description: achievements.description,
          icon: achievements.icon,
          rarity: achievements.type,
          points: achievements.pointsReward,
          category: achievements.type
        })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(eq(userAchievements.userId, userIdInt));

      // Map to UserAchievement format
      const achievementsList: UserAchievement[] = userAchievementsData.map((item: any) => ({
        id: item.achievementId.toString(),
        name: item.name,
        description: item.description,
        icon: item.icon,
        rarity: item.rarity as any,
        points: item.points,
        category: item.category as any,
        // User achievement data - mapping to expected interface
        userId: userId,
        achievementId: item.achievementId.toString(),
        progress: item.progress || 0,
        isCompleted: item.isUnlocked || false,
        isUnlocked: item.isUnlocked || false, // Mantener compatibilidad
        unlockedAt: item.unlockedAt || null
      } as any));

      // Check referral progress for existing achievements
      await this.checkReferralProgressForAchievements(userId);

      console.log(`✅ User achievements loaded: ${achievementsList.length} achievements`);
      return achievementsList;
    } catch (error) {
      console.error(`❌ Error getting achievements for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get leaderboard data using database
   */
  static async getLeaderboard(type: string, limit = 10): Promise<LeaderboardEntry[]> {
    console.log(`🏅 GamificationService: Getting leaderboard ${type}, limit ${limit}`);
    try {
      // Query gamification_profiles directly to ensure we get existing data
      console.log(`🔍 DEBUG: Querying gamification_profiles for leaderboard...`);
      const profiles = await db
        .select()
        .from(gamificationProfiles)
        .orderBy(desc(gamificationProfiles.totalPoints))
        .limit(limit);

      console.log(`🔍 DEBUG: Found ${profiles.length} profiles`);

      if (profiles.length === 0) {
        console.log(`ℹ️ No leaderboard data found - no gamification profiles in database`);
        return [];
      }

      // Map to LeaderboardEntry format directly from schema
      const leaderboard: LeaderboardEntry[] = profiles.map((item: any, index: number) => ({
        id: item.userId.toString(),
        userId: item.userId.toString(),
        // Use schema field names directly - alias for compatibility
        points: item.totalPoints || 0, // Duplicate for interface compatibility
        totalPoints: item.totalPoints || 0,
        currentLevel: item.currentLevel || 1,
        // Map schema fields to expected interface
        walletAddress: item.walletAddress,
        rank: index + 1,
        // Required interface fields with defaults
        projectsApplied: item.projectsApplied || 0,
        projectsApproved: item.projectsApproved || 0,
        totalInvested: Number(item.totalInvested || 0),
        achievementsUnlocked: 0,
        communityRank: item.communityRank || 0,
        lastActivity: new Date((item.lastActivityDate as string | number | Date) || (item.updatedAt as string | number | Date) || new Date()),
        levelProgress: item.levelProgress || 0,
        currentStreak: item.currentStreak || 0,
        reputationScore: item.reputationScore || 0,
        communityContributions: item.communityContributions || 0,
        referralsCount: item.referralsCount || 0,
        joinedAt: new Date(item.createdAt as string | number | Date || new Date())
      }));

      console.log(`✅ Leaderboard data loaded: ${leaderboard.length} users from database`);
      console.log(`🚀 Top user points:`, leaderboard[0]?.totalPoints || 'none');
      return leaderboard;
    } catch (error) {
      console.error(`❌ Error getting leaderboard:`, error);
      return [];
    }
  }

  /**
   * Get available rewards for user using database
   */
  static async getAvailableRewards(userId: string): Promise<Reward[]> {
    console.log(`🎁 GamificationService: Getting available rewards for user ${userId}`);
    try {
      // For now, return empty array - will be implemented with database
      await new Promise(resolve => setTimeout(resolve, 0)); // Dummy await
      return [];
    } catch (error) {
      console.error(`❌ Error getting rewards for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Trigger achievement unlock manually (public API)
   */
  static async triggerAchievementUnlock(userId: string, eventType: string, totalPoints: number): Promise<void> {
    await this.checkAndUnlockAchievements(userId, eventType, totalPoints);
  }

  /**
   * Approve project and award points to creator (admin action)
   */
  static async approveProject(projectId: number, adminWalletAddress: string): Promise<{ success: boolean; message: string; pointsAwarded?: number }> {
    console.log(`✅ GamificationService: Approving project ${projectId} by admin ${adminWalletAddress}`);

    try {
      // Get project details to find the creator
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project || project.length === 0 || !project[0]) {
        return { success: false, message: 'Proyecto no encontrado' };
      }

      const projectData = project[0];
      const creatorWallet = projectData.applicantWalletAddress;

      if (!creatorWallet) {
        return { success: false, message: 'Proyecto no tiene wallet del creador' };
      }

      // Update project status to approved
      await db
        .update(projects)
        .set({
          status: 'approved'
        })
        .where(eq(projects.id, projectId));

      // Award points to creator for project approval
      await this.trackEvent(
        creatorWallet,
        'project_application_approved',
        {
          projectId: projectId.toString(),
          projectTitle: projectData.title,
          approvedBy: adminWalletAddress,
          approvalDate: new Date().toISOString()
        }
      );

      console.log(`✅ Project ${projectId} approved, 100 points awarded to creator ${creatorWallet}`);

      return {
        success: true,
        message: `Proyecto aprobado exitosamente. Se otorgaron 100 tokens al creador.`,
        pointsAwarded: 100
      };

    } catch (error) {
      console.error(`❌ Error approving project ${projectId}:`, error);
      return {
        success: false,
        message: 'Error interno al aprobar el proyecto'
      };
    }
  }

  /**
   * Get singleton instances for external use
   */
  static getEngine(): GamificationEngine {
    return GamificationService.engine;
  }
// static getDatabaseService(): DatabaseService { // Commented out - using direct DB access instead
//   return GamificationService.dbService;
// }

/**
 * Get event points based on event type
 */
private static getEventPoints(eventType: string): number {
  // Map frontend "DAILY_LOGIN" to database "daily_login"
  const normalizedEventType = eventType === 'DAILY_LOGIN' ? 'daily_login' : eventType;

  const pointsMap: Record<string, number> = {
    'project_application_submitted': 50,
    'project_application_approved': 100,
    'investment_made': 25,
    'daily_login': 10,
    'user_registered': 20,
    'referral_made': 200,
    'referral_completed': 100, // Bonus adicional cuando referido completa onboarding + proyecto
    'COURSE_STARTED': 10,
    'COURSE_COMPLETED': 100
  };

  return pointsMap[normalizedEventType] ?? 0;
}

/**
 * Get event category from event type
 */
private static getEventCategory(eventType: string): string {
  // Map frontend "DAILY_LOGIN" to database "daily_login"
  const normalizedEventType = eventType === 'DAILY_LOGIN' ? 'daily_login' : eventType;

  const categoryMap: Record<string, string> = {
    'project_application_submitted': 'projects',
    'project_application_approved': 'projects',
    'investment_made': 'investments',
    'user_registered': 'community',
    'daily_login': 'daily'
  };

  return categoryMap[normalizedEventType] ?? 'special';
}

/**
 * Get points category from event type
 */
private static getPointsCategory(eventType: string): string {
  // Map frontend "DAILY_LOGIN" to database "daily_login"
  const normalizedEventType = eventType === 'DAILY_LOGIN' ? 'daily_login' : eventType;

  const categoryMap: Record<string, string> = {
    'project_application_submitted': 'project_application',
    'project_application_approved': 'project_application',
    'investment_made': 'investment',
    'daily_login': 'daily_login'
  };

  return categoryMap[normalizedEventType] ?? 'special_event';
}

/**
 * Award points to database
 */
private static async awardPointsToDb(
  userId: string,
  points: number,
  reason: string,
  category: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // For demo purposes, use the userId as string to match User table structure

    // Insert points record
    await db.insert(userPoints).values({
      userId: userId,
      points,
      reason,
      category: category as any,
      metadata,
      createdAt: new Date()
    });

    // Update user profile
    await this.updateUserProfilePoints(userId, points);
  } catch (error) {
    console.error(`❌ Error awarding points to database for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Update user profile points in database
 */
private static async updateUserProfilePoints(userId: string, pointsToAdd: number): Promise<void> {
  try {
    console.log(`💾 Updating profile points for user ${userId}: +${pointsToAdd} points`);

    // For demo purposes, use the userId as string to match User table structure

    // Get current profile
    const currentProfile = await db
      .select()
      .from(gamificationProfiles)
      .where(eq(gamificationProfiles.userId, userId))
      .limit(1);

    if (!currentProfile[0]) {
      console.error(`❌ Profile not found for user ${userId}`);
      throw new Error('Profile not found');
    }

    const oldLevel = currentProfile[0].currentLevel;
    const newTotalPoints = currentProfile[0].totalPoints + pointsToAdd;
    const newLevel = Math.floor(newTotalPoints / 100) + 1;
    const newLevelProgress = newTotalPoints % 100;

    console.log(`📊 Profile update: ${currentProfile[0].totalPoints} → ${newTotalPoints} points, Level ${oldLevel} → ${newLevel}`);

    // Update profile
    await db
      .update(gamificationProfiles)
      .set({
        totalPoints: newTotalPoints,
        currentLevel: newLevel,
        levelProgress: newLevelProgress,
        pointsToNextLevel: 100 - newLevelProgress,
        updatedAt: new Date()
      })
      .where(eq(gamificationProfiles.userId, userId));

    console.log(`✅ Profile updated successfully for user ${userId}`);

    // Check for level up
    if (newLevel > oldLevel) {
      console.log(`🎉 LEVEL UP! User ${userId} reached level ${newLevel}!`);
    }
  } catch (error) {
    console.error(`❌ Error updating profile points for user ${userId}:`, error);
    throw error;
  }
}

  /**
   * Check and unlock achievements based on user progress and events
   */
  private static async checkAndUnlockAchievements(userId: string, eventType: string, totalPoints: number): Promise<void> {
    try {
      console.log(`🎯 Checking achievements for user ${userId}, event: ${eventType}, points: ${totalPoints}`);

      // First, find the user_id from users table using wallet_address
      const user = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.walletAddress, userId))
        .limit(1);

      if (!user || user.length === 0 || !user[0]) {
        return;
      }

      const userIdInt = user[0].id;

      // Create basic achievements if they don't exist
      await this.initializeBasicAchievements();

      // Check for specific achievements based on event
      if (eventType === 'DAILY_LOGIN') {
        // Unlock "Primer Login" achievement
        await this.unlockAchievement(userId, 'primer_login');
        console.log(`🎉 Unlocked "Primer Login" achievement for user ${userId}`);
      }

      // 🎯 PROJECT APPLICATION: Achievement por primera aplicación enviada
      if (eventType === 'project_application_submitted') {
        await this.unlockAchievement(userId, 'primer_aplicante');
        console.log(`🎉 Unlocked "Primer Aplicante" achievement for user ${userId}`);
      }

      // 🎯 PROJECT APPROVAL: Achievement por proyecto aprobado por admin
      if (eventType === 'project_application_approved') {
        await this.unlockAchievement(userId, 'proyecto_aprobado');
        console.log(`🎉 Unlocked "Proyecto Aprobado" achievement for user ${userId}`);
      }

      // 🎯 REFERIDOS: Achievement por primer referido exitoso
      if (eventType === 'referral_made') {
        await this.unlockAchievement(userId, 'promotor_de_comunidad');
        console.log(`🎉 Unlocked "Promotor de Comunidad" achievement for referrer ${userId}`);
      }

      // 🎯 NUEVOS: MAPPINGS FALTANTES PARA CURSOS
      if (eventType === 'COURSE_STARTED') {
        await this.unlockAchievement(userId, 'curso_iniciado');
        console.log(`🎉 Unlocked "Curso Iniciado" achievement for user ${userId}`);
      }

      if (eventType === 'COURSE_COMPLETED') {
        await this.unlockAchievement(userId, 'curso_completado');
        console.log(`🎉 Unlocked "Curso Completado" achievement for user ${userId}`);
      }

      // Check for other achievements based on total points
      if (totalPoints >= 25) {
        await this.unlockAchievement(userId, 'explorador_intrépido');
        console.log(`🎉 Unlocked "Explorador Intrépido" achievement for user ${userId}`);
      }

      if (totalPoints >= 100) {
        await this.unlockAchievement(userId, 'primer_aplicante');
        console.log(`🎉 Unlocked "Primer Aplicante" achievement for user ${userId}`);
      }

      console.log(`✅ Achievement check complete for user ${userId}`);
    } catch (error) {
      console.error(`❌ Error checking achievements for user ${userId}:`, error);
      // Don't throw error here - achievements are bonus features
    }
  }

  /**
   * Initialize basic achievements in database
   */
  private static async initializeBasicAchievements(): Promise<void> {
    try {
      // 🙋‍♂️ DASHBOARD SPECIFIC ACHIEVEMENTS (equivalents to package achievements)
      const basicAchievements = [
        {
          name: "Primer Login",
          description: "Conecta tu wallet exitosamente",
          icon: "🔗",
          type: "community_builder" as any,
          required_points: 10,
          required_level: 1,
          required_events: JSON.stringify(["DAILY_LOGIN"]),
          points_reward: 0,
          badge_url: "/badges/first-login.png",
          is_active: true,
          is_secret: false,
          created_at: new Date()
        },
        {
          name: "Explorador Intrépido",
          description: "Gana tus primeros 25 tokens",
          icon: "🔍",
          type: "explorer" as any,
          required_points: 25,
          required_level: 1,
          required_events: JSON.stringify([]),
          points_reward: 0,
          badge_url: "/badges/explorer.png",
          is_active: true,
          is_secret: false,
          created_at: new Date()
        },
        {
          name: "Primer Aplicante",
          description: "Gana 100 tokens por actividades",
          icon: "📝",
          type: "creator" as any,
          required_points: 100,
          required_level: 1,
          required_events: JSON.stringify([]),
          points_reward: 0,
          badge_url: "/badges/applicant.png",
          is_active: true,
          is_secret: false,
          created_at: new Date()
        },
        {
          name: "Promotor de Comunidad",
          description: "Obtén tu primer referido exitoso",
          icon: "🎯",
          type: "social" as any,
          required_points: 0,
          required_level: 1,
          required_events: JSON.stringify(["referral_made"]),
          points_reward: 500,
          badge_url: "/badges/referrer.png",
          is_active: true,
          is_secret: false,
          created_at: new Date()
        },
        {
          name: "Proyecto Aprobado",
          description: "Tu proyecto fue aprobado por el equipo de Pandora's",
          icon: "✅",
          type: "creator" as any,
          required_points: 0,
          required_level: 1,
          required_events: JSON.stringify(["project_application_approved"]),
          points_reward: 100,
          badge_url: "/badges/project-approved.png",
          is_active: true,
          is_secret: false,
          created_at: new Date()
        },
        {
          name: "Maestro Recrutador",
          description: "Ayuda a 5 personas a unirse",
          icon: "🎉",
          type: "social" as any,
          required_points: 0,
          required_level: 1,
          required_events: JSON.stringify([]),
          points_reward: 1000,
          badge_url: "/badges/recruiter.png",
          is_active: true,
          is_secret: false,
          created_at: new Date()
        },
        {
          name: "Referido Completado",
          description: "Completa tu referido realizando acciones importantes",
          icon: "🎯",
          type: "social" as any,
          required_points: 0,
          required_level: 1,
          required_events: JSON.stringify(["referral_completed"]),
          points_reward: 100,
          badge_url: "/badges/referral-completed.png",
          is_active: true,
          is_secret: false,
          created_at: new Date()
        }
      ];

      // First import and convert TOKENIZATION_ACHIEVEMENTS from package
      // (Dynamic import to avoid build issues if package is not available)
      try {
        const { TOKENIZATION_ACHIEVEMENTS } = await import('@pandoras/gamification');
        console.log(`📦 Loading ${TOKENIZATION_ACHIEVEMENTS.length} achievements from package...`);

        // Convert package achievements to dashboard format
        const packageAchievements = TOKENIZATION_ACHIEVEMENTS.map(pkgAchievement => ({
          name: pkgAchievement.name,
          description: pkgAchievement.description,
          icon: pkgAchievement.icon,
          type: pkgAchievement.category as any,
          required_points: pkgAchievement.points,
          required_level: 1,
          required_events: JSON.stringify(pkgAchievement.requirements),
          points_reward: pkgAchievement.points,
          badge_url: `/${pkgAchievement.category}-badges/${pkgAchievement.id}`,
          is_active: pkgAchievement.isActive,
          is_secret: pkgAchievement.isSecret,
          created_at: new Date()
        }));

        // Merge with dashboard achievements
        const allAchievements = [...basicAchievements, ...packageAchievements];
        console.log(`🏆 Total achievements to initialize: ${allAchievements.length}`);

        // Only insert if not exists (by name)
        for (const achievement of allAchievements) {
          const exists = await db
            .select()
            .from(achievements)
            .where(eq(achievements.name, achievement.name))
            .limit(1);

          if (exists.length === 0) {
            await db.insert(achievements).values(achievement);
            console.log(`🏆 Created achievement: ${achievement.name}`);
          }
        }

        console.log(`✅ Achievements initialization complete: ${allAchievements.length} total`);
      } catch (importError) {
        console.warn('⚠️ Could not import TOKENIZATION_ACHIEVEMENTS from package, using only basic achievements:', importError);

        // Fallback to basic achievements only
        for (const achievement of basicAchievements) {
          const exists = await db
            .select()
            .from(achievements)
            .where(eq(achievements.name, achievement.name))
            .limit(1);

          if (exists.length === 0) {
            await db.insert(achievements).values(achievement);
            console.log(`🏆 Created achievement: ${achievement.name}`);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing basic achievements:', error);
      // Don't throw - this is optional
    }
  }

  /**
   * Unlock achievement for user if not already unlocked
   */
  private static async unlockAchievement(userIdString: string, achievementName: string): Promise<void> {
    try {
      // Find achievement by name
      const achievement = await db
        .select()
        .from(achievements)
        .where(eq(achievements.name, achievementName))
        .limit(1);

      if (!achievement || achievement.length === 0 || !achievement[0]) {
        console.error(`Achievement "${achievementName}" not found`);
        return;
      }

      const achievementId = achievement[0].id;

      // Get user numeric ID from string
      const user = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.walletAddress, userIdString))
        .limit(1);

      if (!user || user.length === 0 || !user[0]) {
        console.error(`User not found for wallet ${userIdString}`);
        return;
      }

      const userIdInt = user[0].id;

      // Check if user already has this achievement unlocked using raw SQL
      const existingResult = await db.execute(sql`
        SELECT * FROM user_achievements
        WHERE user_id = ${userIdInt} AND achievement_id = ${achievementId}
        LIMIT 1
      `);

      const existingRows = (existingResult as any).rows || [];
      if (existingRows.length > 0 && existingRows[0].is_unlocked) {
        return; // Already unlocked
      }

      if (existingRows.length > 0) {
        // Update existing using raw SQL
        await db.execute(sql`
          UPDATE user_achievements
          SET
            progress = 100,
            is_unlocked = true,
            unlocked_at = NOW(),
            last_updated = NOW()
          WHERE user_id = ${userIdInt} AND achievement_id = ${achievementId}
        `);
      } else {
        // Insert new achievement for user
        await db.execute(sql`
          INSERT INTO user_achievements
          (user_id, achievement_id, progress, is_unlocked, unlocked_at, last_updated)
          VALUES (${userIdInt}, ${achievementId}, 100, true, NOW(), NOW())
        `);
      }

      console.log(`🎉 Achievement unlocked: ${achievementName} for user ${userIdString}`);

      // 🎯 UPDATE REFERRAL PROGRESS: Si el usuario desbloqueó un achievement, actualizar progreso de referidos
      if (achievementName !== 'Primer Login') { // Excluir "Primer Login" ya que es automático
        try {
          // Importar dinámicamente para evitar problemas de dependencias circulares
          const { updateReferralProgress } = await import('@/app/api/referrals/process/route');
          await updateReferralProgress(userIdString);
          console.log(`✅ Referral progress updated for achievement unlock: ${userIdString.slice(0, 6)}...`);
        } catch (referralError) {
          console.warn('⚠️ Failed to update referral progress for achievement unlock:', referralError);
          // No bloquear el desbloqueo del achievement si falla la actualización de referidos
        }
      }
    } catch (error) {
      console.error(`Error unlocking achievement ${achievementName}:`, error);
      // Don't throw - achievements are bonus features
    }
  }

  /**
   * Validate system health and log status
   */
  static async validateSystemHealth(): Promise<{
    isHealthy: boolean;
    databaseConnection: boolean;
    gamificationEngine: boolean;
    errors: string[];
  }> {
    console.log(`🔍 Validating gamification system health...`);
    const errors: string[] = [];
    let databaseConnection = false;
    let gamificationEngine = false;

    try {
      // Test database connection
      await db.select().from(gamificationProfiles).limit(1);
      databaseConnection = true;
      console.log(`✅ Database connection: OK`);
    } catch (error) {
      errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`❌ Database connection: FAILED`, error);
    }

    try {
      // Test gamification engine
      const engine = GamificationEngine.getInstance();
      gamificationEngine = !!engine;
      console.log(`✅ Gamification engine: OK`);
    } catch (error) {
      errors.push(`Gamification engine failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`❌ Gamification engine: FAILED`, error);
    }

    const isHealthy = databaseConnection && gamificationEngine && errors.length === 0;

    console.log(`🏥 System health check complete: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    if (errors.length > 0) {
      console.log(`🚨 Errors found:`, errors);
    }

    return {
      isHealthy,
      databaseConnection,
      gamificationEngine,
      errors
    };
  }
}

// Export individual functions for API routes AND frontend usage
export const getUserGamificationProfile = async (userId: string) => GamificationService.getUserProfile(userId);
export const trackGamificationEvent = async (userId: string, eventType: string, metadata?: Record<string, unknown>) =>
GamificationService.trackEvent(userId, eventType, metadata);
export const awardGamificationPoints = async (userId: string, points: number, reason: string, category: string, metadata?: Record<string, unknown>) =>
GamificationService.awardPoints(userId, points, reason, category, metadata);
export const getGamificationLeaderboard = async (type: string, limit?: number) => GamificationService.getLeaderboard(type, limit);
export const getUserGamificationAchievements = async (userId: string) => GamificationService.getUserAchievements(userId);
export const getAvailableGamificationRewards = async (userId: string) => GamificationService.getAvailableRewards(userId);



/**
 * Initialize gamification data with sample achievements and rewards
 */
export async function initializeGamificationData(): Promise<void> {
  console.log(`🚀 Initializing gamification data...`);

  try {
    // Insert sample achievements
    const sampleAchievements = [
      {
        name: "Primeros Pasos",
        description: "Completa tu primera aplicación de proyecto",
        icon: "🎯",
        type: "first_steps" as any,
        requiredPoints: 50,
        requiredLevel: 1,
        requiredEvents: JSON.stringify(["project_application_submitted"]),
        pointsReward: 25,
        badgeUrl: "/badges/first-steps.png",
        isActive: true,
        isSecret: false,
        createdAt: new Date()
      },
      {
        name: "Inversionista Activo",
        description: "Realiza tu primera inversión",
        icon: "💎",
        type: "investor" as any,
        requiredPoints: 100,
        requiredLevel: 2,
        requiredEvents: JSON.stringify(["investment_made"]),
        pointsReward: 50,
        badgeUrl: "/badges/investor.png",
        isActive: true,
        isSecret: false,
        createdAt: new Date()
      },
      {
        name: "Constructor de Comunidad",
        description: "Participa activamente en la comunidad",
        icon: "🌟",
        type: "community_builder" as any,
        requiredPoints: 200,
        requiredLevel: 3,
        requiredEvents: JSON.stringify(["community_post", "referral_made"]),
        pointsReward: 100,
        badgeUrl: "/badges/community-builder.png",
        isActive: true,
        isSecret: false,
        createdAt: new Date()
      }
    ];

    for (const achievement of sampleAchievements) {
      await db.insert(achievements).values(achievement).onConflictDoNothing();
    }

    // Insert sample rewards
    const sampleRewards = [
      {
        name: "Descuento Token 10%",
        description: "10% de descuento en tu próxima inversión",
        icon: "💰",
        type: "token_discount" as any,
        requiredPoints: 100,
        requiredLevel: 2,
        value: "10%",
        metadata: JSON.stringify({ discountType: "percentage", maxDiscount: 100 }),
        isActive: true,
        stock: null, // unlimited
        claimedCount: 0,
        createdAt: new Date()
      },
      {
        name: "Acceso Prioritario",
        description: "Acceso anticipado a nuevos proyectos",
        icon: "⚡",
        type: "priority_access" as any,
        requiredPoints: 250,
        requiredLevel: 3,
        value: "7 días",
        metadata: JSON.stringify({ accessType: "early", durationDays: 7 }),
        isActive: true,
        stock: 100,
        claimedCount: 0,
        createdAt: new Date()
      },
      {
        name: "NFT Exclusivo",
        description: "NFT conmemorativo de Pandora's Finance",
        icon: "�",
        type: "nft" as any,
        requiredPoints: 500,
        requiredLevel: 5,
        value: "1 NFT",
        metadata: JSON.stringify({ nftType: "commemorative", rarity: "rare" }),
        isActive: true,
        stock: 50,
        claimedCount: 0,
        createdAt: new Date()
      }
    ];

    for (const reward of sampleRewards) {
      await db.insert(rewards).values(reward).onConflictDoNothing();
    }

    console.log(`✅ Gamification data initialized successfully`);
  } catch (error) {
    console.error(`❌ Error initializing gamification data:`, error);
    throw error;
  }
}
