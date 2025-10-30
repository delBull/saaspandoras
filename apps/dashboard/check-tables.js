import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTables() {
  try {
    await client.connect();
    console.log('📊 Checking existing tables...');
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Existing tables:');
    result.rows.forEach(row => console.log('  -', row.table_name));
    
    // Check if users table exists
    const usersCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    
    console.log('\n👤 Users table exists:', usersCheck.rows[0].exists);

    // Check if specific user exists (try with original case first)
    const testWalletUpper = '0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9';
    const testWalletLower = '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9';

    const userExistsUpper = await client.query(`
      SELECT COUNT(*) as count FROM users
      WHERE "walletAddress" = $1
    `, [testWalletUpper]);

    const userExistsLower = await client.query(`
      SELECT COUNT(*) as count FROM users
      WHERE "walletAddress" = $1
    `, [testWalletLower]);

    console.log(`\n🔍 Test user exists (${testWalletUpper}):`, userExistsUpper.rows[0].count > 0);
    console.log(`🔍 Test user exists (${testWalletLower}):`, userExistsLower.rows[0].count > 0);

    // Determine which case to use for gamification profile
    const walletToUse = userExistsUpper.rows[0].count > 0 ? testWalletUpper : testWalletLower;
    console.log(`🔍 Using wallet for gamification check: ${walletToUse}`);

    // Check gamification profile
    const gamificationProfile = await client.query(`
      SELECT COUNT(*) as count, total_points, current_level FROM gamification_profiles
      WHERE "wallet_address" = $1
    `, [walletToUse]);

    console.log(`\n🏆 Gamification profile exists (${walletToUse}):`, gamificationProfile.rows[0].count > 0);
    if (gamificationProfile.rows[0].count > 0) {
      console.log(`   Puntos: ${gamificationProfile.rows[0].total_points}, Nivel: ${gamificationProfile.rows[0].current_level}`);
    }
    
    client.end();
  } catch (err) {
    console.error('❌ DB Connection error:', err);
    process.exit(1);
  }
}

checkTables();
