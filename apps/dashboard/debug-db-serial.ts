import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(connectionString);

async function main() {
  try {
    console.log("Checking database version and tables...");
    const version = await sql`SELECT version()`;
    console.log("Postgres Version:", version[0].version);

    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Tables in public schema:", tables.map(t => t.table_name));

    console.log("\nChecking 'email_metrics' column details if exists...");
    const emailMetricsColumns = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'email_metrics'
    `;
    if (emailMetricsColumns.length > 0) {
      console.table(emailMetricsColumns);
    } else {
      console.log("'email_metrics' table does not exist.");
    }

  } catch (error) {
    console.error("Error during debug:", error);
  } finally {
    await sql.end();
  }
}

main();
