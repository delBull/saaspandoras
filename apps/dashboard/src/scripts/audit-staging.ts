import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/db/schema';
import { sql } from 'drizzle-orm';

// STAGING CONNECTION
const DATABASE_URL_STAGING = "postgresql://neondb_owner:npg_9lRfvsopJ2UM@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function auditStaging() {
  console.log('🌐 Auditing STAGING Database...');
  const client = postgres(DATABASE_URL_STAGING);
  const db = drizzle(client, { schema });

  // 1. Get Narai ID on staging
  const [narai] = await db.select().from(schema.projects).where(sql`slug = 'narai'`);
  if (!narai) {
    console.error('❌ Project "narai" not found on staging.');
    return;
  }
  console.log(`✅ Staging Narai Project ID: ${narai.id}`);

  // 2. Count leads on staging
  const stats = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN email IS NOT NULL OR "wallet_address" IS NOT NULL THEN 1 ELSE 0 END) as identified,
      SUM(CASE WHEN email IS NULL AND "wallet_address" IS NULL THEN 1 ELSE 0 END) as anonymous
    FROM marketing_leads
    WHERE "project_id" = ${narai.id}
  `);
  console.log('--- Narai Lead Stats ---');
  console.log(stats[0]);

  // 3. Look for misattributed leads on staging
  const misattributed = await db.execute(sql`
    SELECT id, "project_id", origin, email, "created_at"
    FROM marketing_leads
    WHERE ("origin" LIKE '%narai%' OR "metadata"->>'origin' LIKE '%narai%')
    AND "project_id" != ${narai.id}
  `);
  console.log('--- Misattributed Leads ---');
  console.log(misattributed);

  // 4. Look for leads with NO project_id (though notNull, let's be sure)
  const noProject = await db.execute(sql`
    SELECT id, origin, email, "created_at"
    FROM marketing_leads
    WHERE "project_id" IS NULL
  `);
  console.log('--- Leads with NO Project ID ---');
  console.log(noProject);

  // 5. Look at Project ID 1 (Pandora) for Narai origins
  const pandoraMisfires = await db.execute(sql`
    SELECT id, origin, email, "created_at"
    FROM marketing_leads
    WHERE "project_id" = 1
    AND "origin" LIKE '%narai%'
  `);
  console.log('--- Narai Leads misfired to Pandora (ID 1) ---');
  console.log(pandoraMisfires);

  await client.end();
}

auditStaging().catch(console.error);
