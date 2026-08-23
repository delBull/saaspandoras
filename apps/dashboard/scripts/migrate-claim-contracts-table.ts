import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is missing.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  console.log('Creating hermes_claim_contracts table in PostgreSQL/Neon...');

  await sql`
    CREATE TABLE IF NOT EXISTS "hermes_claim_contracts" (
      "id" varchar(255) PRIMARY KEY NOT NULL,
      "tenant_id" varchar(255) NOT NULL,
      "version" integer DEFAULT 1 NOT NULL,
      "contract_hash" varchar(64) NOT NULL,
      "ipfs_cid" varchar(255) NOT NULL,
      "ipfs_uri" varchar(512) NOT NULL,
      "claims" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "signed_by_address" varchar(42) NOT NULL,
      "agent_signature" text NOT NULL,
      "governance_status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "hermes_cc_tenant_version_idx" ON "hermes_claim_contracts" ("tenant_id", "version");
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS "hermes_cc_cid_idx" ON "hermes_claim_contracts" ("ipfs_cid");
  `;

  console.log('✅ Table hermes_claim_contracts and indexes created successfully in Neon!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Migration failed:', err?.message || err);
  process.exit(1);
});
