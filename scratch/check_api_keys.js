import postgres from 'postgres';

const DATABASE_URL_STAGING = "postgresql://neondb_owner:REMOVED_ROTATE_PASSWORD@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  const sql = postgres(DATABASE_URL_STAGING);
  
  try {
    const clients = await sql`SELECT id, name, environment, project_id, is_active FROM integration_clients WHERE project_id = 2`;
    console.log("Integration Clients for Project ID 2:");
    console.log(JSON.stringify(clients, null, 2));
    
    // Check if the specific key exists by hash?
    // We can just list them.
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
main();
