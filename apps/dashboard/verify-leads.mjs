import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

// Manual env load if needed, but we can also pass them
const MAIN_DB = "postgresql://neondb_owner:npg_MjazsA5ybWQ3@ep-summer-bread-adqdsnx4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
const STAGING_DB = "postgresql://neondb_owner:npg_9lRfvsopJ2UM@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function checkLeads() {
  console.log('--- Checking MAIN DB ---');
  const sqlMain = postgres(MAIN_DB);
  try {
    const leads = await sqlMain`SELECT id, email, project_id, created_at FROM marketing_leads ORDER BY created_at DESC LIMIT 5`;
    console.table(leads);
  } catch (e) {
    console.error('Error Main:', e.message);
  } finally {
    await sqlMain.end();
  }

  console.log('\n--- Checking STAGING DB ---');
  const sqlStaging = postgres(STAGING_DB);
  try {
    const leads = await sqlStaging`SELECT id, email, project_id, created_at FROM marketing_leads ORDER BY created_at DESC LIMIT 5`;
    console.table(leads);
  } catch (e) {
    console.error('Error Staging:', e.message);
  } finally {
    await sqlStaging.end();
  }
}

checkLeads();
