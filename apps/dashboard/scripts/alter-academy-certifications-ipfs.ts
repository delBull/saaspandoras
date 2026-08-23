import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is missing.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  console.log('Adding IPFS & signature columns to academy_certifications in Neon...');

  await sql`
    ALTER TABLE "academy_certifications"
    ADD COLUMN IF NOT EXISTS "ipfs_cid" varchar(255),
    ADD COLUMN IF NOT EXISTS "ipfs_uri" varchar(512),
    ADD COLUMN IF NOT EXISTS "signed_by_address" varchar(42),
    ADD COLUMN IF NOT EXISTS "agent_signature" text,
    ADD COLUMN IF NOT EXISTS "rubric_snapshot_cid" varchar(255);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS "academy_certifications_ipfs_cid_idx" ON "academy_certifications" ("ipfs_cid");
  `;

  console.log('✅ IPFS columns added to academy_certifications in Neon!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Migration failed:', err?.message || err);
  process.exit(1);
});
