#!/usr/bin/env node

/**
 * Script to sync local database data to staging database
 * This will overwrite staging data with local data
 * Usage: node apps/dashboard/sync-local-to-staging.mjs
 */

import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Starting sync: Local DB → Staging DB...');

async function syncDatabases() {
  // Change to project root directory to access .env file
  process.chdir(path.join(__dirname, '../..'));

  // Load environment variables from .env file
  try {
    const envPath = path.join(process.cwd(), '.env');
    const fs = await import('fs');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = envContent.split('\n').filter(line => line.includes('='));
      for (const envVar of envVars) {
        const [key, ...valueParts] = envVar.split('=');
        const value = valueParts.join('=').replace(/['"]/g, '');
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Could not load .env file, using default connection string');
  }

  // Local database connection (using local .env)
  const localConnectionString = process.env.DATABASE_URL || 'postgresql://Marco@localhost:5432/pandoras_local';
  console.log('📊 Connecting to local database...');

  // Staging database connection (hardcoded for staging)
  const stagingConnectionString = 'postgresql://neondb_owner:npg_uj0h1LpbAQxi@ep-withered-thunder-adt88vka-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
  console.log('🌍 Connecting to staging database...');

  let localSql, stagingSql;

  try {
    // Connect to both databases
    localSql = postgres(localConnectionString, { prepare: false });
    stagingSql = postgres(stagingConnectionString, { prepare: false });

    console.log('✅ Connected to both databases');

    // Tables to sync (in order of dependencies)
    const tables = [
      'administrators',
      'users', // local table name
      'projects',
      'gamification_profiles',
      'gamification_events',
      'user_points',
      'user_achievements',
      'user_rewards'
    ];

    // Get data from local database
    console.log('📤 Exporting data from local database...');
    const localData = {};

    for (const table of tables) {
      console.log(`  📋 Exporting ${table}...`);
      const data = await localSql`SELECT * FROM ${localSql.unsafe(table)}`;
      localData[table] = data;
      console.log(`    ✅ Exported ${data.length} records`);
    }

    // Clear staging database and import data
    console.log('🗑️ Clearing staging database...');

    // Truncate tables in reverse dependency order (CASCADE will handle foreign keys)
    const truncateOrder = [...tables].reverse();
    for (const table of truncateOrder) {
      const stagingTableName = table === 'users' ? 'User' : table;
      console.log(`  🗑️ Truncating ${stagingTableName}...`);
      try {
        // Use quoted table name for reserved words like "User"
        const quotedTableName = stagingTableName === 'User' ? '"User"' : stagingTableName;
        await stagingSql`TRUNCATE TABLE ${stagingSql.unsafe(quotedTableName)} CASCADE`;
      } catch (error) {
        console.log(`  ⚠️ Could not truncate ${stagingTableName}, it might not exist: ${error.message}`);
      }
    }

    console.log('📥 Importing data to staging database...');

    // Import data in dependency order
    for (const table of tables) {
      const stagingTableName = table === 'users' ? 'User' : table;
      const data = localData[table];

      if (data.length === 0) {
        console.log(`  ⏭️ Skipping ${stagingTableName} (no data)`);
        continue;
      }

      console.log(`  📋 Importing ${data.length} records to ${stagingTableName}...`);

      // Insert data in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        // Build insert query dynamically
        if (batch.length > 0) {
          const columns = Object.keys(batch[0]);
          const values = batch.map(row =>
            `(${columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              if (typeof value === 'object') return `'${JSON.stringify(value)}'`;
              return value;
            }).join(', ')})`
          ).join(', ');

          // Use quoted table name for reserved words like "User"
          const quotedTableName = stagingTableName === 'User' ? '"User"' : stagingTableName;
          const insertSQL = `INSERT INTO ${quotedTableName} (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${values}`;
          await stagingSql.unsafe(insertSQL);
        }
      }

      console.log(`    ✅ Imported ${data.length} records to ${stagingTableName}`);
    }

    // Verify the sync
    console.log('🔍 Verifying sync...');

    const localCount = await localSql`SELECT COUNT(*) as count FROM users`;
    const stagingCount = await stagingSql`SELECT COUNT(*) as count FROM ${stagingSql.unsafe('"User"')}`;

    console.log(`📊 Users: Local=${localCount[0].count}, Staging=${stagingCount[0].count}`);

    const localProjects = await localSql`SELECT COUNT(*) as count FROM projects`;
    const stagingProjects = await stagingSql`SELECT COUNT(*) as count FROM projects`;

    console.log(`📁 Projects: Local=${localProjects[0].count}, Staging=${stagingProjects[0].count}`);

    console.log('✅ Sync completed successfully!');
    console.log('🎉 Your staging database now has the same data as your local database');

  } catch (error) {
    console.error('❌ Error during sync:', error);
    process.exit(1);
  } finally {
    if (localSql) await localSql.end();
    if (stagingSql) await stagingSql.end();
  }
}

// Run the sync
syncDatabases().catch(console.error);
