import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { users, gamificationProfiles, achievements, userAchievements } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createGamificationData() {
  try {
    await client.connect();
    const db = drizzle(client);

    // Find user by wallet (lowercase)
    const wallet = '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9';

    console.log('🔍 Finding user by wallet:', wallet);
    const user = await db.select().from(users).where(eq(users.walletAddress, wallet)).limit(1);
    if (!user || user.length === 0) {
      console.error('❌ User not found');
      return;
    }

    const userId = user[0].id;
    console.log('👤 Found user ID:', userId);

    // Create gamification profile if it doesn't exist
    const existingProfile = await db.select().from(gamificationProfiles).where(eq(gamificationProfiles.userId, userId)).limit(1);

    if (existingProfile.length === 0) {
      console.log('📝 Creating gamification profile...');
      await db.insert(gamificationProfiles).values({
        userId: userId,
        walletAddress: wallet,
        totalPoints: 10, // From daily login
        currentLevel: 1,
        levelProgress: 10,
        pointsToNextLevel: 90,
        projectsApplied: 0,
        projectsApproved: 0,
        totalInvested: '0.00',
        communityContributions: 0,
        currentStreak: 1,
        longestStreak: 1,
        totalActiveDays: 1,
        referralsCount: 0,
        communityRank: 0,
        reputationScore: 0,
        lastActivityDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Created gamification profile with 10 points');
    } else {
      console.log('ℹ️ Profile already exists');
    }

    // Create achievements if they don't exist
    const basicAchievements = await db.select().from(achievements);
    if (basicAchievements.length === 0) {
      console.log('🏆 Creating basic achievements...');
      await db.insert(achievements).values([
        {
          name: 'Primer Login',
          description: 'Conecta tu wallet exitosamente',
          icon: '🔗',
          type: 'first_steps',
          requiredPoints: 10,
          requiredLevel: 1,
          pointsReward: 0,
          isActive: true,
          isSecret: false,
          createdAt: new Date()
        },
        {
          name: 'Explorador Intrépido',
          description: 'Gana tus primeros 25 tokens',
          icon: '🔍',
          type: 'investor',
          requiredPoints: 25,
          requiredLevel: 1,
          pointsReward: 0,
          isActive: true,
          isSecret: false,
          createdAt: new Date()
        }
      ]);
      console.log('✅ Created basic achievements');
    } else {
      console.log('ℹ️ Achievements already exist');
    }

    // Unlock 'Primer Login' achievement
    const primerLogin = await db.select().from(achievements).where(eq(achievements.name, 'Primer Login')).limit(1);
    if (primerLogin.length > 0) {
      const achievementId = primerLogin[0].id;

      // Check if already unlocked
      const existingUnlock = await db.select().from(userAchievements)
        .where(eq(userAchievements.userId, userId))
        .where(eq(userAchievements.achievementId, achievementId))
        .limit(1);

      if (existingUnlock.length === 0) {
        console.log('🏅 Unlocking "Primer Login" achievement...');
        await db.insert(userAchievements).values({
          userId,
          achievementId,
          progress: 100,
          isUnlocked: true,
          unlockedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ Unlocked "Primer Login" achievement');
      } else {
        console.log('ℹ️ Achievement already unlocked');
      }
    } else {
      console.log('❌ Primer Login achievement not found');
    }

    console.log('🎉 Gamification data creation complete!');

    client.end();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

createGamificationData();
