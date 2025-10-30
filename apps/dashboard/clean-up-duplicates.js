import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function cleanUpDuplicates() {
  try {
    await client.connect();

    console.log('🧹 CLEANING UP DUPLICATES...\n');

    const wallet = '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9';

    // Get the correct user ID
    const userQuery = await client.query(`
      SELECT id FROM users WHERE "walletAddress" = $1
    `, [wallet]);

    if (userQuery.rows.length === 0) {
      console.error('❌ User not found');
      return;
    }

    const correctUserId = userQuery.rows[0].id;
    console.log(`👤 Correct user ID: ${correctUserId}`);

    // 1. Remove duplicate gamification profile (the one where user_id is the wallet address)
    const deleteDuplicateProfile = await client.query(`
      DELETE FROM gamification_profiles
      WHERE user_id = $1 AND id != (
        SELECT MAX(id) FROM gamification_profiles WHERE user_id = $2
      )
    `, [wallet, correctUserId]);

    console.log(`🗑️ Removed duplicate gamification profiles: ${deleteDuplicateProfile.rowCount}`);

    // 2. Clean up duplicate achievements - keep only unique names
    const duplicates = await client.query(`
      SELECT name, COUNT(*)
      FROM achievements
      GROUP BY name
      HAVING COUNT(*) > 1
      ORDER BY name
    `);

    console.log(`📊 Duplicate achievement names found: ${duplicates.rows.length}`);

    for (const dup of duplicates.rows) {
      // Delete duplicates keeping only the first one by ID
      await client.query(`
        DELETE FROM achievements
        WHERE name = $1 AND id NOT IN (
          SELECT MIN(id)
          FROM achievements
          WHERE name = $1
        )
      `, [dup.name]);
    }

    console.log('🧹 Cleaned duplicate achievements');

    // 3. Ensure user_achievements are consistent after cleanup
    // Remove any user_achievements for non-existent achievements
    await client.query(`
      DELETE FROM user_achievements
      WHERE achievement_id NOT IN (
        SELECT id FROM achievements
      )
    `);

    console.log('🧹 Cleaned orphaned user_achievements');

    console.log('\n✅ DUPLICATE CLEANUP COMPLETE');

    client.end();
  } catch (err) {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
  }
}

cleanUpDuplicates();
