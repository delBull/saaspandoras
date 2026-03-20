import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(connectionString);

async function main() {
  try {
    console.log("Checking email_metrics table columns...");
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'email_metrics'
    `;
    
    const columnNames = columns.map(c => c.column_name);
    console.log("Current columns:", columnNames);

    if (!columnNames.includes('delivered_at')) {
      console.log("Adding delivered_at column...");
      await sql`ALTER TABLE email_metrics ADD COLUMN delivered_at timestamp with time zone`;
    }

    if (!columnNames.includes('bounced_at')) {
      console.log("Adding bounced_at column...");
      await sql`ALTER TABLE email_metrics ADD COLUMN bounced_at timestamp with time zone`;
    }

    console.log("Database update complete!");
  } catch (error) {
    console.error("Error updating database:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
