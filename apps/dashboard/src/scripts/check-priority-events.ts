import postgres from 'postgres';

const DATABASE_URL_STAGING = "postgresql://neondb_owner:npg_9lRfvsopJ2UM@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function checkPriorityEvents() {
  const sql = postgres(DATABASE_URL_STAGING);
  const res = await sql`
    SELECT e.id, e.type, e.lead_id, e.payload, e.created_at, l.email, l.wallet_address
    FROM marketing_lead_events e
    LEFT JOIN marketing_leads l ON e.lead_id = l.id
    WHERE e.type IN ('FORM_SUBMIT', 'IDENTIFY', 'LEAD_SUBMIT', 'WIDGET_SUBMIT')
    ORDER BY e.created_at DESC
    LIMIT 20
  `;
  console.log(JSON.stringify(res, null, 2));
  await sql.end();
}

checkPriorityEvents().catch(console.error);
