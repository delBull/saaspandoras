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
  max: 100, // Increased to 100 to handle parallel API calls from dashboard hydration
  idle_timeout: 30, // Increased to 30 to keep connections alive longer
  connect_timeout: 20, // Increased to 20 to allow more time during high concurrency peaks
  prepare: false,
  ssl: isProduction ? 'require' : false,
  debug: (connection, query, params) => {
    if (process.env.DEBUG_DB === 'true') {
      console.log('SQL:', query);
    }
  }
});

if (!isProduction) {
  globalForPostgres.sqlInstance = sql;
}

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
