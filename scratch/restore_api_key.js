import postgres from 'postgres';
import crypto from 'crypto';

const DATABASE_URL_STAGING = "postgresql://neondb_owner:npg_9lRfvsopJ2UM@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  const sql = postgres(DATABASE_URL_STAGING);
  
  try {
    const rawKey = "pk_test_b277293448bd09198b6fd29ff0b87c4e1c9184219ff50111";
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    const fingerprint = rawKey.slice(0, 12) + '...' + rawKey.slice(-4);
    
    console.log("Restoring hash:", hashedKey);
    console.log("Fingerprint:", fingerprint);

    const inserted = await sql`
      INSERT INTO integration_clients (id, name, environment, project_id, api_key_hash, key_fingerprint, is_active, permissions)
      VALUES (gen_random_uuid(), 'Client: Narai (Restored)', 'staging', 2, ${hashedKey}, ${fingerprint}, true, '["read:state"]')
      RETURNING id, name, environment, is_active;
    `;
    
    console.log("Inserted client:", inserted);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
main();
