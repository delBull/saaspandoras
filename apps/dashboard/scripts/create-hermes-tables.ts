import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Creating hermes_conversations and hermes_conversation_messages tables...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "hermes_conversations" (
      "id" varchar(256) PRIMARY KEY NOT NULL,
      "organization_id" varchar(256) NOT NULL,
      "conversation_id" varchar(256) NOT NULL,
      "version" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "hermes_conversation_messages" (
      "id" varchar(256) PRIMARY KEY NOT NULL,
      "organization_id" varchar(256) NOT NULL,
      "conversation_id" varchar(256) NOT NULL,
      "role" varchar(50) NOT NULL,
      "content" text NOT NULL,
      "sequence" integer NOT NULL,
      "idempotency_key" varchar(256) NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "hermes_conv_unique" ON "hermes_conversations" ("organization_id", "conversation_id");
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "hermes_conv_msg_org_conv_idx" ON "hermes_conversation_messages" ("organization_id", "conversation_id");
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "hermes_conv_msg_seq_idx" ON "hermes_conversation_messages" ("organization_id", "conversation_id", "sequence");
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "hermes_conv_msg_idem_idx" ON "hermes_conversation_messages" ("organization_id", "idempotency_key");
  `);

  console.log('Tables created successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
