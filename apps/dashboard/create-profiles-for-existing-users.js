import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createProfilesForExistingUsers() {
  try {
    await client.connect();

    console.log('👥 CREATING GAMIFICATION PROFILES FOR EXISTING USERS...\n');

    // Get all users that don't have gamification profiles yet
    const usersWithoutProfiles = await client.query(`
      SELECT u.id, u."walletAddress", u.name, u.email
      FROM users u
      LEFT JOIN gamification_profiles gp ON u."walletAddress"::VARCHAR(42) = gp.wallet_address
      WHERE gp.wallet_address IS NULL
      AND u."walletAddress" IS NOT NULL
    `);

    console.log(`Found ${usersWithoutProfiles.rows.length} users without gamification profiles`);

    if (usersWithoutProfiles.rows.length === 0) {
      console.log('✅ All users already have gamification profiles!');
      return;
    }

    // Create gamification profiles for each user
    for (let i = 0; i < usersWithoutProfiles.rows.length; i++) {
      const user = usersWithoutProfiles.rows[i];

      console.log(`${i + 1}. Creating profile for user: ${user.name || user.email || user.walletAddress}`);

      // Generate a sequential user_id for gamification_profiles
      // Since users.id is UUID but gamification_profiles.user_id is integer
      const nextUserIdResult = await client.query(`
        SELECT COALESCE(MAX(user_id), 0) + 1 as next_id FROM gamification_profiles
      `);
      const nextUserId = nextUserIdResult.rows[0].next_id;

      await client.query(`
        INSERT INTO gamification_profiles (
          user_id,
          wallet_address,
          total_points,
          current_level,
          level_progress,
          points_to_next_level,
          projects_applied,
          projects_approved,
          total_invested,
          community_contributions,
          current_streak,
          longest_streak,
          total_active_days,
          referrals_count,
          community_rank,
          reputation_score,
          last_activity_date,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, 0, 1, 0, 100, 0, 0, '0.00', 0, 0, 0, 0, 0, 0, 0,
          NOW(), NOW(), NOW()
        )
      `, [nextUserId, user.walletAddress]);

      console.log(`   ✅ Created gamification profile for user ID: ${user.id}`);
    }

    console.log(`\n🎉 SUCCESS: Created gamification profiles for ${usersWithoutProfiles.rows.length} existing users`);

    // Verify the profiles were created
    const profileCount = await client.query('SELECT COUNT(*) as count FROM gamification_profiles');
    console.log(`📊 Total gamification profiles in database: ${profileCount.rows[0].count}`);

    client.end();
  } catch (err) {
    console.error('❌ Error creating profiles:', err);
    process.exit(1);
  }
}

createProfilesForExistingUsers();
