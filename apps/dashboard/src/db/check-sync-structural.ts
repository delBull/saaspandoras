import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local for database URLs
dotenv.config({ path: path.resolve(process.cwd(), 'apps/dashboard/.env.local') });

const envs = [
  { name: 'LOCAL', url: process.env.DATABASE_URL },
  { name: 'STAGING', url: process.env.DATABASE_URL_STAGING },
  { name: 'MAIN', url: process.env.DATABASE_URL_MAIN }
];

interface SchemaInfo {
  tables: Set<string>;
  columns: Map<string, Set<string>>;
}

async function getSchema(url: string): Promise<SchemaInfo> {
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
  const sql = postgres(url, { 
    ssl: isLocal ? false : 'require' 
  });
  try {
    const columns = await sql`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
    `;

    const tables = new Set<string>();
    const colsMap = new Map<string, Set<string>>();

    for (const row of columns) {
      const tableName = row.table_name as string;
      const colName = row.column_name as string;
      tables.add(tableName);
      if (!colsMap.has(tableName)) colsMap.set(tableName, new Set());
      colsMap.get(tableName)!.add(colName);
    }

    return { tables, columns: colsMap };
  } finally {
    await sql.end();
  }
}

async function run() {
  console.log('🚀 Starting Structural DB Sync Check...');
  
  const results: Record<string, SchemaInfo> = {};

  for (const env of envs) {
    if (!env.url) {
      console.error(`❌ Missing URL for ${env.name}`);
      continue;
    }
    console.log(`📡 Fetching schema from ${env.name}...`);
    try {
      const schema = await getSchema(env.url);
      results[env.name] = schema;
      console.log(`✅ ${env.name}: Found ${schema.tables.size} tables.`);
    } catch (e) {
      console.error(`❌ Failed to fetch ${env.name}:`, (e as Error).message);
    }
  }

  const envNames = Object.keys(results);
  if (envNames.length < 2) {
    console.error('❌ Not enough environments to compare.');
    process.exit(1);
  }

  // Use the first environment as baseline (usually LOCAL should be most up-to-date with code)
  const baselineName = 'LOCAL';
  const baseline = results[baselineName];

  if (!baseline) {
    console.error(`❌ Baseline (${baselineName}) schema not found among fetched results: ${envNames.join(', ')}`);
    process.exit(1);
  }

  console.log('\n📊 --- COMPARISON (vs LOCAL) ---');

  for (const name of envNames) {
    if (name === baselineName) continue;
    const target = results[name];
    if (!target) continue;

    console.log(`\n🔍 Comparing ${baselineName} ➡️ ${name}:`);

    // Missing Tables
    const missingTables = [...baseline.tables].filter(t => !target.tables.has(t));
    if (missingTables.length > 0) {
      console.log(`  ⚠️  Missing TABLES in ${name}:`, missingTables.join(', '));
    }

    // Extra Tables
    const extraTables = [...target.tables].filter(t => !baseline.tables.has(t));
    if (extraTables.length > 0) {
      console.log(`  ➕ Extra TABLES in ${name}:`, extraTables.join(', '));
    }

    // Column Mismatches
    for (const table of baseline.tables) {
      if (target.tables.has(table)) {
        const baseCols = baseline.columns.get(table);
        const targetCols = target.columns.get(table);

        if (baseCols && targetCols) {
          const missingCols = [...baseCols].filter(c => !targetCols.has(c));
          const extraCols = [...targetCols].filter(c => !baseCols.has(c));

          if (missingCols.length > 0 || extraCols.length > 0) {
            console.log(`  📁 Table '${table}':`);
            if (missingCols.length > 0) console.log(`      ❌ Missing COLUMNS: ${missingCols.join(', ')}`);
            if (extraCols.length > 0) console.log(`      ➕ Extra COLUMNS: ${extraCols.join(', ')}`);
          }
        }
      }
    }
  }

  console.log('\n🏁 Structural check finished.');
}

run().catch(console.error);
