#!/usr/bin/env node

/**
 * Script to sync local database data to Staging and Production databases
 * Usage: node sync-all-dbs.js
 */

let postgres = require('postgres');
if (postgres.default) postgres = postgres.default;
require('dotenv').config({ path: 'apps/dashboard/.env.local' });

const LOCAL_URL = process.env.DATABASE_URL || 'postgresql://Marco@localhost:5432/pandoras_local';
const STAGING_URL = process.env.DATABASE_URL_STAGING;
const PRODUCTION_URL = process.env.DATABASE_URL_MAIN;

if (!STAGING_URL || !PRODUCTION_URL) {
  console.error('❌ Error: DATABASE_URL_STAGING and DATABASE_URL_MAIN must be defined in apps/dashboard/.env.local');
  process.exit(1);
}

console.log('🔄 Starting sync: Local DB → Staging & Production...');

const tables = [
  'administrators',
  'users',
  'projects',
  'integration_clients',
  'gamification_profiles',
  'gamification_events',
  'user_points',
  'user_achievements',
  'user_rewards',
  'marketing_leads',
  'marketing_lead_events',
  'marketing_lead_attributions',
  'marketing_campaigns',
  'demand_drafts',
  'campaigns',
  'demand_events',
  'campaign_stats'
];


async function syncTo(targetName, targetUrl) {
  console.log(`\n🚀 Syncing to ${targetName}...`);
  
  const localSql = postgres(LOCAL_URL, { prepare: false });
  const targetSql = postgres(targetUrl, { prepare: false });

  try {
    for (const table of tables) {
      const localTableName = table;
      // In some environments, the users table is capital 'User'
      let targetTableName = table === 'users' ? 'User' : table;
      
      console.log(`  📋 Processing ${table}...`);
      
      // Get local data
      const localData = await localSql`SELECT * FROM ${localSql.unsafe(localTableName)}`;
      console.log(`    ✅ Exported ${localData.length} records from Local`);

      if (localData.length === 0) {
        console.log(`    ⏭️ Skipping ${targetTableName} (no data)`);
        continue;
      }

      // Truncate target
      console.log(`    🗑️ Truncating ${targetTableName} on ${targetName}...`);
      const quotedTargetTable = targetTableName === 'User' ? '"User"' : targetTableName;
      try {
        await targetSql`TRUNCATE TABLE ${targetSql.unsafe(quotedTargetTable)} CASCADE`;
      } catch (e) {
        console.warn(`    ⚠️ Warning: Could not truncate ${targetTableName}: ${e.message}`);
      }

      // Import data
      console.log(`    📥 Importing ${localData.length} records to ${targetTableName}...`);
      const batchSize = 100;
      for (let i = 0; i < localData.length; i += batchSize) {
        const batch = localData.slice(i, i + batchSize);
        if (batch.length > 0) {
          const columns = Object.keys(batch[0]);
          const values = batch.map(row => {
            return `(${columns.map(col => {
              const value = row[col];
              if (value === null || value === undefined) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
              if (value instanceof Date) return `'${value.toISOString()}'`;
              return value;

            }).join(', ')})`;
          }).join(', ');

          const insertSQL = `INSERT INTO ${quotedTargetTable} (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${values}`;
          await targetSql.unsafe(insertSQL);
        }
      }
      console.log(`    ✅ Success: ${table} synced.`);
    }
    console.log(`✅ Sync to ${targetName} completed!`);
  } catch (error) {
    console.error(`❌ Error syncing to ${targetName}:`, error);
  } finally {
    await localSql.end();
    await targetSql.end();
  }
}

async function run() {
  await syncTo('Staging', STAGING_URL);
  await syncTo('Production', PRODUCTION_URL);
  console.log('\n✨ All sync operations finished.');
}

run().catch(console.error);
