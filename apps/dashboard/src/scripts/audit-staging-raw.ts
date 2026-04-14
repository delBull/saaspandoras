import postgres from 'postgres';

const DATABASE_URL_STAGING = "postgresql://neondb_owner:npg_9lRfvsopJ2UM@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function auditStaging() {
  console.log('🌐 Direct SQL Audit on STAGING...');
  const sql = postgres(DATABASE_URL_STAGING);

  // 1. Get Narai ID and domains
  const projects = await sql`SELECT id, allowed_domains FROM projects WHERE slug = 'narai'`;
  if (projects.length === 0) {
    console.error('❌ Narai project not found.');
    return;
  }
  const naraiId = projects[0].id;
  console.log(`✅ Narai Project ID: ${naraiId}`);
  console.log(`🌐 Allowed Domains: ${JSON.stringify(projects[0].allowed_domains)}`);

  // 2. Count all leads for Narai
  const stats = await sql`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN email IS NOT NULL OR wallet_address IS NOT NULL THEN 1 ELSE 0 END) as identified,
      SUM(CASE WHEN email IS NULL AND wallet_address IS NULL THEN 1 ELSE 0 END) as anonymous
    FROM marketing_leads
    WHERE project_id = ${naraiId}
  `;
  console.log('--- Narai Lead Stats ---');
  console.log(stats[0]);

  // 3. Inspect recent anonymous leads for Narai
  const recentAnonymous = await sql`
    SELECT id, email, wallet_address, origin, metadata, created_at, is_deleted
    FROM marketing_leads
    WHERE project_id = ${naraiId}
    AND email IS NULL AND wallet_address IS NULL
    ORDER BY created_at DESC
    LIMIT 10
  `;
  console.log('--- Recent Anonymous Leads (most recent 10) ---');
  console.log(JSON.stringify(recentAnonymous, null, 2));

  // 4. Check if any identified leads are hidden (deleted)
  const hiddenIdentified = await sql`
    SELECT id, email, wallet_address, is_deleted
    FROM marketing_leads
    WHERE project_id = ${naraiId}
    AND (email IS NOT NULL OR wallet_address IS NOT NULL)
    AND is_deleted = true
  `;
  console.log('--- Hidden (Deleted) Identified Leads ---');
  console.log(hiddenIdentified);

  // 5. Look for high-priority events that might be orphaned
  const priorityEvents = await sql`
    SELECT e.id, e.type, e.lead_id, e.payload, e.created_at, l.email, l.wallet_address
    FROM marketing_lead_events e
    LEFT JOIN marketing_leads l ON e.lead_id = l.id
    WHERE e.type IN ('FORM_SUBMIT', 'IDENTIFY', 'LEAD_SUBMIT', 'WIDGET_SUBMIT')
    ORDER BY e.created_at DESC
    LIMIT 20
  `;
  console.log('--- Recent High-Priority Events ---');
  console.log(JSON.stringify(priorityEvents, null, 2));

  // 6. Look at the most recent 50 leads across ALL projects
  const absoluteRecent = await sql`
    SELECT id, project_id, email, wallet_address, origin, metadata, created_at
    FROM marketing_leads
    ORDER BY created_at DESC
    LIMIT 50
  `;
  console.log('--- Most Recent 50 Leads (Global) ---');
  console.log(JSON.stringify(absoluteRecent, null, 2));

  await sql.end();
}

auditStaging().catch(console.error);
