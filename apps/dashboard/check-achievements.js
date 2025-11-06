// Script para verificar achievements en la DB
const { db } = require('./apps/dashboard/src/db');
const { eq } = require('drizzle-orm');
const { achievements, userAchievements, users, gamificationProfiles } = require('./apps/dashboard/src/db/schema');

async function checkAchievements() {
  try {
    console.log('🔍 Verificando achievements en la DB...\n');

    // 1. Verificar achievements existentes
    const allAchievements = await db.select().from(achievements);
    console.log(`📊 Total achievements en DB: ${allAchievements.length}`);
    allAchievements.forEach(achievement => {
      console.log(`  - ${achievement.name} (${achievement.type})`);
    });

    // 2. Verificar achievements específicos que mencionó el usuario
    const specificAchievements = [
      'Primer Login',
      'Primer Borrador',
      'Aplicante Proactivo',
      'Proyecto Aprobado'
    ];

    console.log('\n🎯 Verificando achievements específicos:');
    for (const name of specificAchievements) {
      const achievement = await db.select().from(achievements).where(eq(achievements.name, name)).limit(1);
      if (achievement.length > 0) {
        console.log(`  ✅ ${name} - EXISTE (ID: ${achievement[0].id})`);
      } else {
        console.log(`  ❌ ${name} - NO EXISTE`);
      }
    }

    // 3. Verificar usuarios y sus achievements
    const allUsers = await db.select({
      id: users.id,
      walletAddress: users.walletAddress
    }).from(users).limit(5);

    console.log('\n👥 Verificando achievements de usuarios:');
    for (const user of allUsers) {
      const userAchievementsData = await db.select({
        achievementName: achievements.name,
        isUnlocked: userAchievements.isUnlocked,
        unlockedAt: userAchievements.unlockedAt
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, user.id));

      console.log(`\n  Usuario ${user.walletAddress?.substring(0, 8)}...: ${userAchievementsData.length} achievements`);
      userAchievementsData.forEach(ua => {
        console.log(`    - ${ua.achievementName}: ${ua.isUnlocked ? '✅ DESBLOQUEADO' : '❌ BLOQUEADO'} ${ua.unlockedAt ? `(${ua.unlockedAt})` : ''}`);
      });

      // Verificar puntos del usuario
      const profile = await db.select().from(gamificationProfiles).where(eq(gamificationProfiles.userId, user.id.toString())).limit(1);
      if (profile.length > 0) {
        console.log(`    💰 Puntos totales: ${profile[0].totalPoints}`);
      }
    }

  } catch (error) {
    console.error('❌ Error verificando achievements:', error);
  } finally {
    process.exit(0);
  }
}

checkAchievements();
