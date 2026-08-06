import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { max: 1 });

async function runManualMigration() {
  console.log('🚀 Creando tablas hermes_jobs y hermes_journal...');
  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "hermes_jobs" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "tenant_id" varchar(255) NOT NULL,
        "state" varchar(50) NOT NULL,
        "request" jsonb NOT NULL,
        "result" jsonb,
        "callback_secret" varchar(255),
        "provider_id" varchar(255),
        "expires_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "hermes_journal" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "request_id" varchar(255) NOT NULL,
        "tenant_id" varchar(255) NOT NULL,
        "capability" varchar(255) NOT NULL,
        "execution_status" varchar(50) NOT NULL,
        "artifacts_generated" integer DEFAULT 0,
        "resolved_binding" jsonb,
        "resolved_provider" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    console.log('✅ Tablas creadas exitosamente!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error aplicando SQL:', err);
    process.exit(1);
  }
}

runManualMigration();
