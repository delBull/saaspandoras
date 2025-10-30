import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkAchievementsOnly() {
  try {
    await client.connect();
    const walletLower = '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9';

    console.log('🏅 CHECKING ACHIEVEMENTS STATE...\n');

    // Check all gamification profiles
    const allProfiles = await client.query(`
      SELECT id, user_id, total_points, current_level, wallet_address
      FROM gamification_profiles
      ORDER BY id
    `);

    console.log('🏆 All Gamification Profiles:');
    console.log(`   Total: ${allProfiles.rows.length}`);
    allProfiles.rows.forEach((profile, index) => {
      console.log(`   ${index + 1}. ID:${profile.id} User:${profile.user_id} Points:${profile.total_points} Wallet:${profile.wallet_address}`);
    });

    // Check achievements in database
    const allAchievements = await client.query(`
      SELECT COUNT(*) as count FROM achievements
    `);
    console.log(`\n⚙️ Total achievements in DB: ${allAchievements.rows[0].count}`);

    if (allAchievements.rows[0].count > 0) {
      const achievementList = await client.query(`
        SELECT id, name, "points_reward" FROM achievements ORDER BY id
      `);
      console.log(`🏅 Achievement list (${achievementList.rows.length}):`);
      achievementList.rows.forEach((ach, index) => {
        console.log(`   ${index + 1}. ID:${ach.id} "${ach.name}" (${ach.points_reward} pts)`);
      });
    }

    // Get user by wallet
    const userQuery = await client.query(`
      SELECT id FROM users WHERE "walletAddress" = $1
    `, [walletLower]);

    if (userQuery.rows.length > 0) {
      const userId = userQuery.rows[0].id;
      console.log(`\n👤 User found: ${userId}`);

      // Check user achievements for this user
      const userAchievements = await client.query(`
        SELECT ua.achievement_id, ua.is_unlocked, ua.progress, a.name
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = $1
        ORDER BY ua.achievement_id
      `, [userId]);

      console.log(`\n🎖️ User Achievements (${userAchievements.rows.length}):`);
      userAchievements.rows.forEach((ua, index) => {
        console.log(`   ${index + 1}. "${ua.name}" - Progress: ${ua.progress} - Status: ${ua.is_unlocked ? 'UNLOCKED' : 'LOCKED'}`);
      });
    } else {
      console.log('\n❌ User not found');
    }

    console.log('\n✅ Check complete - NO DATA CREATED');

    client.end();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkAchievementsOnly();
