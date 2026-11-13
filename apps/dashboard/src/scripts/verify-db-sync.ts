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
  // NUNCA hardcodear endpoints ni credenciales: este archivo queda en el repo.
  // Cada URL se toma del entorno; si falta, se omite la verificación (fail-closed).
  const localUrl = process.env.VERIFY_DB_LOCAL_URL ?? null;
  const stagingUrl = process.env.VERIFY_DB_STAGING_URL ?? null;
  const mainUrl = process.env.VERIFY_DB_MAIN_URL ?? null;

  const localOk = localUrl ? await verifyDb("LOCAL", localUrl) : null;
  const stagingOk = stagingUrl ? await verifyDb("STAGING", stagingUrl) : null;
  const mainOk = mainUrl ? await verifyDb("MAIN", mainUrl) : null;

  console.log("\n--- Final Status ---");
  const label = (value: boolean | null) =>
    value === null ? 'NOT_CONFIGURED' : value ? 'Synced' : 'OUT OF SYNC';

  console.log(`LOCAL:   ${label(localOk)}`);
  console.log(`STAGING: ${label(stagingOk)}`);
  console.log(`MAIN:    ${label(mainOk)}`);

  if (localUrl === null || stagingUrl === null || mainUrl === null) {
    console.log('\nConfigura VERIFY_DB_LOCAL_URL / VERIFY_DB_STAGING_URL / VERIFY_DB_MAIN_URL.');
    process.exitCode = 1;
  }
}

main().catch(console.error);
