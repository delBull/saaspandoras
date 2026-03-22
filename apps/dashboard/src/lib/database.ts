import postgres from "postgres";

// Connection pool configuration for better performance
// This prevents "too many clients" errors by reusing connections
// Connection pool configuration for better performance
// This prevents "too many clients" errors by reusing connections
// Lazy initialization to prevent global side effects during build/import
// Standard Next.js Postgres caching mechanism
const globalForPostgres = globalThis as unknown as {
  sqlInstance: ReturnType<typeof postgres> | undefined;
};

const connectionString = process.env.DATABASE_URL || "";
const isProduction = process.env.NODE_ENV === 'production';

if (!connectionString) {
  console.warn("⚠️ Warning: DATABASE_URL is not set. Database features will fail.");
}

export const sql = globalForPostgres.sqlInstance ?? postgres(connectionString, {
  max: 10,
  idle_timeout: 15,
  connect_timeout: 10,
  prepare: false,
  ssl: isProduction ? 'require' : { rejectUnauthorized: false }, 
  debug: (connection, query, params) => {
    if (process.env.DEBUG_DB === 'true') {
      console.log('SQL:', query);
    }
  }
});

// Shared singleton in all environments (essential for serverless pooling reuse)
globalForPostgres.sqlInstance = sql;

export default sql;

// Health check function
export async function checkDatabaseHealth() {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
