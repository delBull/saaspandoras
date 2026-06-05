import postgres from 'postgres';
import crypto from 'crypto';

const DATABASE_URL_STAGING = "postgresql://neondb_owner:REMOVED_ROTATE_PASSWORD@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  const sql = postgres(DATABASE_URL_STAGING);
  
  try {
    const rawKey = "pk_test_b277293448bd09198b6fd29ff0b87c4e1c9184219ff50111";
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    console.log("Looking for hash:", hashedKey);

    const updated = await sql`
      UPDATE integration_clients 
      SET is_active = true 
      WHERE api_key_hash = ${hashedKey}
      RETURNING id, name, environment, is_active;
    `;
    
    console.log("Updated clients:", updated);
    
    const allMatching = await sql`
      SELECT id, name, is_active FROM integration_clients WHERE api_key_hash = ${hashedKey}
    `;
    console.log("All matching:", allMatching);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
main();
