import { Client } from 'pg';

async function verifyDb(name: string, url: string) {
  console.log(`\n🔍 Verifying ${name} Database...`);
  const client = new Client({ connectionString: url });
  
  try {
    await client.connect();
    
    // 1. Check for marketing_reward_logs table
    const tableRes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'marketing_reward_logs'
      );
    `);
    const tableExists = tableRes.rows[0].exists;
    
    // 2. Check for identity_hash column in marketing_leads
    const columnRes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'marketing_leads' AND column_name = 'identity_hash'
      );
    `);
    const columnExists = columnRes.rows[0].exists;

    // 3. Check for marketing_lead_events (dependency)
    const eventsRes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'marketing_lead_events'
      );
    `);
    const eventsExists = eventsRes.rows[0].exists;

    console.log(`  [${tableExists ? '✅' : '❌'}] Table: marketing_reward_logs`);
    console.log(`  [${columnExists ? '✅' : '❌'}] Column: marketing_leads.identity_hash`);
    console.log(`  [${eventsExists ? '✅' : '❌'}] Table: marketing_lead_events`);

    return tableExists && columnExists && eventsExists;
  } catch (err) {
    console.error(`  [💥] Error connecting to ${name}:`, (err as Error).message);
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  const localUrl = "postgresql://Marco@localhost:5432/pandoras_local";
  const stagingUrl = "postgresql://neondb_owner:npg_IZJDPG21sLkC@ep-muddy-mud-ad6mipow-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const mainUrl = "postgresql://neondb_owner:npg_MjazsA5ybWQ3@ep-summer-bread-adqdsnx4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

  const localOk = await verifyDb("LOCAL", localUrl);
  const stagingOk = await verifyDb("STAGING", stagingUrl);
  const mainOk = await verifyDb("MAIN", mainUrl);

  console.log("\n--- Final Status ---");
  console.log(`LOCAL:   ${localOk ? 'Synced' : 'OUT OF SYNC'}`);
  console.log(`STAGING: ${stagingOk ? 'Synced' : 'OUT OF SYNC'}`);
  console.log(`MAIN:    ${mainOk ? 'Synced' : 'OUT OF SYNC'}`);
}

main().catch(console.error);
