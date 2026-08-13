import { sql } from '../src/lib/database';

async function migrate() {
  console.log("Altering channel_identity_bindings.identity_id to varchar...");
  try {
    await sql`ALTER TABLE "channel_identity_bindings" ALTER COLUMN "identity_id" TYPE varchar(256);`;
    console.log("✅ Column type changed successfully.");
  } catch (err) {
    console.error("❌ Failed to alter table:", err);
  }
  process.exit(0);
}

migrate();
