import pkg from 'pg';
const { Client } = pkg;

async function test() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_i8kHcf5YnSRx@ep-dawn-sea-anegc8ni-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
  });
  
  try {
    await client.connect();
    
    // Check if type exists and what values it has
    const res = await client.query(`SELECT enumlabel FROM pg_enum WHERE enumtypid = 'ambassador_origin'::regtype`);
    console.log('Values:', res.rows.map(r => r.enumlabel));
    
  } catch (error) {
    console.error(error.message);
  } finally {
    await client.end();
  }
}

test();
