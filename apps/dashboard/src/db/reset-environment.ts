import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const targetEnv = process.argv[2] || 'LOCAL'; // LOCAL or STAGING
const dbUrl = targetEnv === 'STAGING' ? process.env.DATABASE_URL_STAGING : process.env.DATABASE_URL;

const ADMIN_WALLETS = [
  "0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9",
  "0x96631d6c5295f1f08334888c5d6f3a246f9c3ba"
];

const TABLES_TO_TRUNCATE = [
  'projects',
  'gamification_profiles',
  'user_points',
  'gamification_events',
  'user_achievements',
  'pbox_balances',
  'pbox_claims',
  'user_rewards',
  'sessions',
  'security_events',
  'auth_challenges',
  'audit_logs',
  'shortlink_events',
  'email_metrics',
  'whatsapp_users',
  'whatsapp_sessions',
  'whatsapp_messages',
  'marketing_campaigns',
  'marketing_executions',
  'governance_events',
  'governance_proposals',
  'governance_votes',
  'governance_executions',
  'governor_sync_state',
  'clients',
  'payment_links',
  'transactions',
  'purchases',
  'dao_activities',
  'dao_activity_submissions',
  'dao_threads',
  'dao_posts',
  'user_balances',
  'shortlinks',
  'user_referrals'
];

async function reset() {
  if (!dbUrl) {
    console.error(`❌ No connection URL for ${targetEnv}`);
    process.exit(1);
  }

  if (targetEnv === 'MAIN' || dbUrl.includes('summer-bread')) {
    console.error('🛑 SAFETY BLOCK: Do not run this on MAIN environment.');
    process.exit(1);
  }

  console.log(`🧹 Resetting environment: ${targetEnv}...`);
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  const sql = postgres(dbUrl, { ssl: isLocal ? false : 'require' });

  try {
    // 1. Structural Fixes (Add missing columns to LOCAL and STAGING if needed)
    if (targetEnv === 'LOCAL' || targetEnv === 'STAGING') {
      console.log(`🛠️ Checking and fixing structural gaps in ${targetEnv}...`);
      
      // Users table
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username varchar(255)`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name varchar(255)`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name varchar(255)`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_frozen boolean DEFAULT false NOT NULL`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_source varchar(255)`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referrer_core_user_id varchar(255)`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_harvest_at timestamp`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb`;

      // Gamification Rules
      await sql`ALTER TABLE gamification_rules ADD COLUMN IF NOT EXISTS points_xp integer`;
      await sql`ALTER TABLE gamification_rules ADD COLUMN IF NOT EXISTS points_credits integer`;
      await sql`ALTER TABLE gamification_rules ADD COLUMN IF NOT EXISTS ipfs_metadata jsonb`;

      // Gamification Logs
      await sql`ALTER TABLE gamification_logs ADD COLUMN IF NOT EXISTS tx_hash varchar(66)`;
      await sql`ALTER TABLE gamification_logs ADD COLUMN IF NOT EXISTS admin_id varchar(255)`;
      await sql`ALTER TABLE gamification_logs ADD COLUMN IF NOT EXISTS ipfs_hash varchar(255)`;
      await sql`ALTER TABLE gamification_logs ADD COLUMN IF NOT EXISTS core_action_id varchar(255)`;

      console.log('✅ Structural fixes applied to LOCAL.');
    }

    // 2. Data Cleanup
    console.log('🗑️ Cleaning up data...');

    for (const table of TABLES_TO_TRUNCATE) {
      try {
        await sql.unsafe(`TRUNCATE TABLE ${table} CASCADE`);
        console.log(`  ✔️ Truncated ${table}`);
      } catch (e) {
        console.warn(`  ⚠️ Could not truncate ${table}: ${(e as Error).message}`);
      }
    }

    // 3. User Cleanup (keep only admins)
    console.log('👤 Cleaning up users (preserving admins)...');
    
    // We can't easily join on administrators table here if it's truncated or if we want exact wallets
    const deletedUsers = await sql`
      DELETE FROM users 
      WHERE "walletAddress" NOT IN ( ${ADMIN_WALLETS} )
      AND "role" != 'admin'
      RETURNING id, "walletAddress"
    `;
    console.log(`  ✔️ Deleted ${deletedUsers.length} non-admin users.`);

    // 4. Reset Administrators table just in case
    console.log('⭐ Re-syncing administrators table...');
    await sql`TRUNCATE TABLE administrators CASCADE`;
    for (const wallet of ADMIN_WALLETS) {
      await sql`
        INSERT INTO administrators (wallet_address, role, added_by)
        VALUES (${wallet.toLowerCase()}, 'admin', 'system_reset')
        ON CONFLICT (wallet_address) DO UPDATE SET role = 'admin'
      `;
    }
    console.log('✅ Administrators re-synced.');

    console.log(`\n🎉 Reset of ${targetEnv} COMPLETED SUCCESSFULLY!`);

  } catch (error) {
    console.error('💥 Reset FAILED:', error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

reset().catch(console.error);
