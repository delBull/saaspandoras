#!/usr/bin/env node
/**
 * apply-migrations.mjs
 * Applies all pending Drizzle SQL migrations to a NeonDB target.
 * Usage: node scripts/apply-migrations.mjs [staging|main]
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

// ⚠️  Never hardcode secrets here. Always pass via DATABASE_URL env var:
//     DATABASE_URL="postgresql://..." node scripts/apply-migrations.mjs
//
// For convenience, you can alias targets in your local shell profile.
// See .env.local for DATABASE_URL_STAGING and DATABASE_URL_MAIN.
const target = process.argv[2] || 'local';
const dbUrl  = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('ERROR: DATABASE_URL env var is required.');
  console.error('Usage: DATABASE_URL="postgresql://..." node scripts/apply-migrations.mjs');
  process.exit(1);
}

const MIGRATIONS_DIR = join(__dirname, '../drizzle');
const DRIZZLE_JOURNAL = join(MIGRATIONS_DIR, 'meta/_journal.json');

const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  console.log(`\n Connected to ${target} DB`);

  await client.query(`CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (id SERIAL PRIMARY KEY, hash TEXT NOT NULL UNIQUE, created_at BIGINT)`).catch(() => {});

  const journal = JSON.parse(readFileSync(DRIZZLE_JOURNAL, 'utf8'));
  const entries = journal.entries || [];
  const applied = await client.query('SELECT hash FROM "__drizzle_migrations"').then(r => new Set(r.rows.map(x => x.hash))).catch(() => new Set());

  let totalOk = 0, totalSkip = 0, totalErr = 0;

  for (const entry of entries) {
    const { tag, when } = entry;
    const sqlFile = join(MIGRATIONS_DIR, `${tag}.sql`);

    if (applied.has(tag)) { console.log(`  SKIP ${tag} (already applied)`); continue; }

    let sql;
    try { sql = readFileSync(sqlFile, 'utf8'); } catch { console.warn(`  MISSING ${tag}.sql`); continue; }

    const stmts = sql.split(/--> ?statement-breakpoint/).map(s => s.trim()).filter(Boolean);
    console.log(`\n FILE ${tag} — ${stmts.length} statements`);

    let ok = 0, skip = 0, err = 0;
    for (let i = 0; i < stmts.length; i++) {
      try {
        await client.query(stmts[i]);
        ok++; process.stdout.write('.');
      } catch(e) {
        const msg = e.message || '';
        if (msg.includes('already exists') || msg.includes('duplicate column') || (msg.includes('ADD VALUE') && msg.includes('already exists'))) {
          skip++; process.stdout.write('S');
        } else {
          err++; console.error(`\n  ERR[${i}]: ${msg.slice(0, 200)}`);
        }
      }
    }
    process.stdout.write('\n');
    totalOk += ok; totalSkip += skip; totalErr += err;

    if (err === 0) {
      await client.query('INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2) ON CONFLICT DO NOTHING', [tag, when]);
      console.log(`  OK: applied ${ok} stmts (${skip} skipped)`);
    } else {
      console.log(`  PARTIAL: ok=${ok} skip=${skip} err=${err}`);
    }
  }

  client.release();
  await pool.end();
  console.log(`\nDone. OK:${totalOk} Skipped:${totalSkip} Errors:${totalErr}`);
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
