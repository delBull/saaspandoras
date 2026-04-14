import { db } from '../db';
import { marketingLeads, projects } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

async function auditLeads() {
  console.log('🔍 Comprehensive Lead Audit for Narai...');
  
  // 1. Get Narai Project
  const [narai] = await db.select().from(projects).where(eq(projects.slug, 'narai'));
  if (!narai) {
    console.error('❌ Project "narai" not found.');
    return;
  }
  console.log(`✅ Narai Project ID: ${narai.id}`);

  // 2. Count leads by identification status
  const stats = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN email IS NOT NULL OR "wallet_address" IS NOT NULL THEN 1 ELSE 0 END) as identified,
      SUM(CASE WHEN email IS NULL AND "wallet_address" IS NULL THEN 1 ELSE 0 END) as anonymous
    FROM marketing_leads
    WHERE "project_id" = ${narai.id}
  `);
  
  console.log('--- Statistics ---');
  console.log(stats[0]);

  // 3. Look for leads with Narai origin but WRONG projectId
  const misattributedLeads = await db.execute(sql`
    SELECT id, "project_id", origin, email, "created_at"
    FROM marketing_leads
    WHERE ("origin" LIKE '%narai%' OR "metadata"->>'origin' LIKE '%narai%')
    AND "project_id" != ${narai.id}
  `);

  console.log('--- Misattributed Leads (Narai origin, different Project ID) ---');
  console.log(misattributedLeads);

  // 4. Look for recent leads (last 24h) regardless of project
  const recentLeads = await db.execute(sql`
    SELECT id, "project_id", email, origin, "created_at"
    FROM marketing_leads
    ORDER BY "created_at" DESC
    LIMIT 20
  `);

  console.log('--- Most Recent 20 Leads ---');
  console.log(recentLeads);
}

auditLeads().catch(console.error);
