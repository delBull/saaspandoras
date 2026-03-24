/**
 * create-bridge-tables.ts
 * 
 * Creates the 3 new Telegram bridge tables directly via SQL.
 * Safer than drizzle-kit push (which would also drop legacy V1 columns).
 * 
 * Run: bun run create-bridge-tables.ts
 */
import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('\n🔧 Creating Telegram Bridge Tables...\n');

    // 1. telegram_bindings
    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS telegram_bindings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      telegram_user_id TEXT NOT NULL UNIQUE,
      wallet_address TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'telegram',
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      last_seen_at TIMESTAMPTZ DEFAULT now() NOT NULL
    )
  `);
    console.log('✅ telegram_bindings created (or already exists)');

    // 2. pbox_balances
    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS pbox_balances (
      wallet_address TEXT PRIMARY KEY,
      total_earned INTEGER NOT NULL DEFAULT 0,
      reserved INTEGER NOT NULL DEFAULT 0,
      claimed INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    )
  `);
    console.log('✅ pbox_balances created (or already exists)');

    // 3. gamification_action_executions
    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS gamification_action_executions (
      event_id TEXT NOT NULL,
      trigger_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      user_id TEXT NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      PRIMARY KEY (event_id, trigger_id, action_type)
    )
  `);
    console.log('✅ gamification_action_executions created (or already exists)');

    // 4. Add index for telegram_bindings wallet lookup
    await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_telegram_bindings_wallet
    ON telegram_bindings(wallet_address)
  `);
    console.log('✅ index on telegram_bindings(wallet_address) created');

    // 5. Add pbox_balances index
    await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_pbox_balances_available
    ON pbox_balances(wallet_address)
    WHERE (total_earned - reserved - claimed) > 0
  `);
    console.log('✅ partial index on pbox_balances (available > 0) created');

    console.log('\n🎉 All bridge tables ready.\n');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
