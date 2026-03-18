#!/usr/bin/env node

/**
 * Script to sync local database data to staging database
 * This will overwrite staging data with local data
 * Usage: node sync-local-to-staging.js
 */

var postgres = require('postgres');
var path = require('path');
var fs = require('fs');

console.log('🔄 Starting sync: Local DB → Staging DB...');

async function syncDatabases() {
  // Local database connection (using local .env)
  var localConnectionString = process.env.DATABASE_URL || 'postgresql://Marco@localhost:5432/pandoras_local';
  console.log('📊 Connecting to local database...');

  // Staging database connection (hardcoded for staging)
  var stagingConnectionString = 'postgresql://neondb_owner:npg_uj0h1LpbAQxi@ep-withered-thunder-adt88vka-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
  console.log('🌍 Connecting to staging database...');

  var localSql, stagingSql;

  try {
    // Connect to both databases
    localSql = postgres(localConnectionString, { prepare: false });
    stagingSql = postgres(stagingConnectionString, { prepare: false });

    console.log('✅ Connected to both databases');

    // Tables to sync (in order of dependencies)
    var tables = [
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
    var localData = {};

    for (var table of tables) {
      console.log(`  📋 Exporting ${table}...`);
      var data = await localSql`SELECT * FROM ${localSql.unsafe(table)}`;
      localData[table] = data;
      console.log(`    ✅ Exported ${data.length} records`);
    }

    // Clear staging database and import data
    console.log('🗑️ Clearing staging database...');

    // Truncate tables in reverse dependency order (CASCADE will handle foreign keys)
    var truncateOrder = [...tables].reverse();
    for (var table of truncateOrder) {
      var stagingTableName = table === 'users' ? 'User' : table;
      console.log(`  🗑️ Truncating ${stagingTableName}...`);
      try {
        // Use quoted table name for reserved words like "User"
        var quotedTableName = stagingTableName === 'User' ? '"User"' : stagingTableName;
        await stagingSql`TRUNCATE TABLE ${stagingSql.unsafe(quotedTableName)} CASCADE`;
      } catch (error) {
        console.log(`  ⚠️ Could not truncate ${stagingTableName}, it might not exist: ${error.message}`);
      }
    }

    console.log('📥 Importing data to staging database...');

    // Import data in dependency order
    for (var table of tables) {
      var stagingTableName = table === 'users' ? 'User' : table;
      var data = localData[table];

      if (data.length === 0) {
        console.log(`  ⏭️ Skipping ${stagingTableName} (no data)`);
        continue;
      }

      console.log(`  📋 Importing ${data.length} records to ${stagingTableName}...`);

      // Insert data in batches to avoid memory issues
      var batchSize = 100;
      for (var i = 0; i < data.length; i += batchSize) {
        var batch = data.slice(i, i + batchSize);

        // Build insert query dynamically
        if (batch.length > 0) {
          var columns = Object.keys(batch[0]);
          var values = batch.map(function(row) {
            return `(${columns.map(function(col) {
              var value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              if (typeof value === 'object') return `'${JSON.stringify(value)}'`;
              return value;
            }).join(', ')})`;
          }).join(', ');

          // Use quoted table name for reserved words like "User"
          var quotedTableName = stagingTableName === 'User' ? '"User"' : stagingTableName;
          var insertSQL = `INSERT INTO ${quotedTableName} (${columns.map(function(c) { return `"${c}"`; }).join(', ')}) VALUES ${values}`;
          await stagingSql.unsafe(insertSQL);
        }
      }

      console.log(`    ✅ Imported ${data.length} records to ${stagingTableName}`);
    }

    // Verify the sync
    console.log('🔍 Verifying sync...');

    var localCount = await localSql`SELECT COUNT(*) as count FROM users`;
    var stagingCount = await stagingSql`SELECT COUNT(*) as count FROM ${stagingSql.unsafe('"User"')}`;

    console.log(`📊 Users: Local=${localCount[0].count}, Staging=${stagingCount[0].count}`);

    var localProjects = await localSql`SELECT COUNT(*) as count FROM projects`;
    var stagingProjects = await stagingSql`SELECT COUNT(*) as count FROM projects`;

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
