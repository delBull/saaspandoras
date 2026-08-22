/**
 * 📥 S'Narai Knowledge Ingestion Script (Hermes OS Knowledge Governance)
 *
 * Ingests all markdown knowledge packs from `src/lib/hermes/packs/snarai_knowledge_v1.1/`
 * directly into the `hermes_knowledge` table in Neon PostgreSQL idempotently.
 */

import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is missing in environment.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const PACK_DIR = path.resolve(__dirname, '../src/lib/hermes/packs/snarai_knowledge_v1.1');

function parseMarkdownFrontmatter(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content.trim() };
  }

  const frontmatterRaw = match[1] || '';
  const body = (match[2] || '').trim();

  const frontmatter: Record<string, string> = {};
  for (const line of frontmatterRaw.split('\n')) {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const key = parts[0]!.trim();
      const val = parts.slice(1).join(':').trim();
      frontmatter[key] = val;
    }
  }

  return { frontmatter, body };
}

async function run() {
  console.log('🚀 Starting S\'Narai Knowledge Ingest into Neon DB...');

  const files = fs.readdirSync(PACK_DIR).filter(f => f.endsWith('.md')).sort();
  console.log(`Found ${files.length} knowledge pack files in ${PACK_DIR}`);

  for (const file of files) {
    const filePath = path.join(PACK_DIR, file);
    const rawText = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = parseMarkdownFrontmatter(rawText);

    const dimension = file.replace(/^\d+_/, '').replace(/\.md$/, '').toUpperCase();
    const key = frontmatter.sourceId || `snarai_${dimension.toLowerCase()}`;
    const organizationId = 'snarai';
    const status = frontmatter.status || 'ACTIVE';
    const visibility = frontmatter.visibility || 'PUBLIC';
    const authority = frontmatter.authority || 'VERIFIED';
    const version = Number(frontmatter.version) || 1;
    const id = `k_snarai_${dimension.toLowerCase()}_v${version}`;

    console.log(`Ingesting [${dimension}] key='${key}'...`);

    await sql`
      INSERT INTO hermes_knowledge (
        id, organization_id, dimension, key, content, status, visibility, authority, version, source, created_by, updated_at
      ) VALUES (
        ${id}, ${organizationId}, ${dimension}, ${key}, ${body}, ${status}, ${visibility}, ${authority}, ${version}, 'DOMAIN_PACK', 'system_ingest', NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        status = EXCLUDED.status,
        visibility = EXCLUDED.visibility,
        authority = EXCLUDED.authority,
        updated_at = NOW();
    `;
  }

  const countResult = await sql`SELECT count(*)::int as count FROM hermes_knowledge WHERE organization_id = 'snarai';`;
  console.log(`✅ S'Narai Knowledge Ingestion Complete! Total active facts for 'snarai': ${countResult[0]?.count}`);
}

run().catch(err => {
  console.error('❌ Ingest failed:', err);
  process.exit(1);
});
