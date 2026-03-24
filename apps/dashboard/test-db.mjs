
import postgres from 'postgres';

const url = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_9lRfvsopJ2UM@ep-cool-feather-ambh76vv-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

console.log(`🚀 Testing connection to: ${url.split('@')[1]}`);

async function testConnection() {
  const sql = postgres(url, { 
    ssl: { rejectUnauthorized: false },
    connect_timeout: 10
  });

  try {
    const result = await sql`SELECT version()`;
    console.log('✅ Connection SUCCESS!');
    console.log('DB Version:', result[0].version);
    
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5`;
    console.log('Tables found:', tables.map(t => t.table_name).join(', '));
    
  } catch (error) {
    console.error('❌ Connection FAILED:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    
    if (error.code === '28P01') {
      console.log('\n💡 SUGGESTION: Password authentication failed. Please verify the password in Neon console.');
    } else if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo')) {
      console.log('\n💡 SUGGESTION: Hostname could not be found. Check if the region or cluster ID is correct.');
    }
  } finally {
    await sql.end();
  }
}

testConnection();
