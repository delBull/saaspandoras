import postgres from 'postgres';

console.log('🔍 Checking gamification profiles in local database...');

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/pandoras_local';
const sql = postgres(connectionString);

async function checkGamification() {
  try {
    // Check gamification profiles
    const profiles = await sql`SELECT user_id, COUNT(*) as count FROM gamification_profiles GROUP BY user_id ORDER BY user_id`;
    console.log('📊 Gamification profiles by user_id:');
    profiles.forEach(p => console.log(`  ${p.user_id}: ${p.count} records`));

    // Check what user_ids exist in users table
    const users = await sql`SELECT id, walletAddress FROM users ORDER BY id`;
    console.log('\n👥 Users table:');
    users.forEach(u => console.log(`  ${u.id}: ${u.walletAddress}`));

    // Find gamification profiles with non-existing user_ids
    console.log('\n🔍 Checking for orphaned gamification data...');
    const orphaned = await sql`
      SELECT gp.user_id, COUNT(*) as gamification_count
      FROM gamification_profiles gp
      LEFT JOIN users u ON gp.user_id = u.id
      WHERE u.id IS NULL
      GROUP BY gp.user_id
    `;
    console.log('🐛 Orphaned gamification data (user_id not in users table):');
    orphaned.forEach(o => console.log(`  ${o.user_id}: ${o.gamification_count} records`));

    // Check if there are gamification profiles tied to existing users
    const validProfiles = await sql`
      SELECT gp.user_id, COUNT(*) as gamification_count, u.walletAddress
      FROM gamification_profiles gp
      JOIN users u ON gp.user_id = u.id
      GROUP BY gp.user_id, u.walletAddress
    `;
    console.log('✅ Valid gamification tied to users:');
    validProfiles.forEach(v => console.log(`  ${v.user_id} (${v.walletAddress}): ${v.gamification_count} records`));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

checkGamification();
