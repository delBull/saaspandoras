import pkg from 'pg';
const { Client } = pkg;

async function test() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_i8kHcf5YnSRx@ep-dawn-sea-anegc8ni-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
  });
  
  try {
    await client.connect();
    console.log('Connected!');
    
    const query = `
      insert into "ambassadors" ("id", "project_id", "referral_code", "wallet_address", "full_name", "email", "phone", "social_url", "email_verified", "verification_token", "origin", "status", "created_at", "updated_at") 
      values (default, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, default, default) 
      returning "id"
    `;
    const params = [2, "TEST-12345", "0x123", "Test User", "test5@example.com", null, null, false, "123456", "snarai", "pending"];
    
    const result = await client.query(query, params);
    console.log('Success:', result.rows);
  } catch (error) {
    console.error('Error Details:');
    console.error(error.message);
    console.error('Code:', error.code);
    console.error('Detail:', error.detail);
  } finally {
    await client.end();
  }
}

test();
