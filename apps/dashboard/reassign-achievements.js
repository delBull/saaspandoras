import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function reassignAchievements() {
  try {
    await client.connect();

    const wallet = '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9';

    // Get user ID
    const userQuery = await client.query(`
      SELECT id FROM users WHERE "walletAddress" = $1
    `, [wallet]);

    if (userQuery.rows.length === 0) {
      console.error('❌ User not found');
      return;
    }

    const userId = userQuery.rows[0].id;

    // Get Primer Login achievement ID
    const primerLogin = await client.query(`
      SELECT id FROM achievements WHERE name = 'Primer Login' ORDER BY id LIMIT 1
    `);

    if (primerLogin.rows.length === 0) {
      console.error('❌ Primer Login achievement not found');
      return;
    }

    const achievementId = primerLogin.rows[0].id;

    // Check if already assigned
    const existing = await client.query(`
      SELECT id FROM user_achievements
      WHERE user_id = $1 AND achievement_id = $2
    `, [userId, achievementId]);

    if (existing.rows.length === 0) {
      // Reassign achievement
      await client.query(`
        INSERT INTO user_achievements (user_id, achievement_id, progress, is_unlocked, created_at, updated_at)
        VALUES ($1, $2, 100, true, NOW(), NOW())
      `, [userId, achievementId]);

      console.log('✅ Reassigned Primer Login achievement');
    } else {
      console.log('ℹ️ Achievement already assigned');
    }

    client.end();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

reassignAchievements();
