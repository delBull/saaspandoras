import postgres from 'postgres';

const DATABASE_URL = 'postgresql://neondb_owner:npg_9lRfvsopJ2UM@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = postgres(DATABASE_URL);

async function cleanup() {
  console.log('--- Phase 87: Lead Cleanup (Post-Fix) ---');
  
  // Use snake_case as suggested by the PG error
  const recentLeads = await sql`
    SELECT id, email, project_id, created_at 
    FROM marketing_leads 
    WHERE created_at > NOW() - INTERVAL '2 hours'
    ORDER BY created_at DESC
  `;
  
  console.log('Found recent leads:', recentLeads.length);
  recentLeads.forEach(l => console.log(`- ${l.email} (Project ID: ${l.project_id})`));

  if (recentLeads.length > 0) {
    const ids = recentLeads.map(l => l.id);
    await sql`
      DELETE FROM marketing_leads 
      WHERE id IN ${sql(ids)}
    `;
    console.log(`Successfully deleted ${recentLeads.length} leads.`);
  } else {
    console.log('No recent leads found to delete.');
  }

  process.exit(0);
}

cleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
