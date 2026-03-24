import postgres from "postgres";

// Connection pool configuration for better performance
// This prevents "too many clients" errors by reusing connections
// Connection pool configuration for better performance
// This prevents "too many clients" errors by reusing connections
// Lazy initialization to prevent global side effects during build/import
// Standard Next.js Postgres caching mechanism
const DATABASE_URL = process.env.DATABASE_URL || "";
if (DATABASE_URL && !DATABASE_URL.includes("-pooler") && DATABASE_URL.includes("neon.tech")) {
  console.warn("⚠️ DATABASE_URL detected without '-pooler' suffix. This may cause connection exhaustion in serverless environments.");
  // Optional: throw Error in production if you want to be strict
  // if (process.env.NODE_ENV === 'production') throw new Error("Production DB must use Neon Pooler (-pooler)");
}

// Standard Next.js Postgres caching mechanism
const globalForPostgres = globalThis as unknown as {
  sqlInstance: ReturnType<typeof postgres> | undefined;
};

// Use a more resilient configuration for serverless
export const sqlInstance = globalForPostgres.sqlInstance || postgres(DATABASE_URL, {
  max: 15, // Slightly increased but still safe for Neon Free/Paid tiers
  idle_timeout: 30, // Increased to keep connections alive longer between warm starts
  connect_timeout: 10,
  prepare: false, // Essential for Neon pooled connections
  ssl: { rejectUnauthorized: false }, // Consistent across environments to prevent SSL chain errors
  debug: (connection, query, params) => {
    if (process.env.DEBUG_DB === 'true') {
      console.log('SQL:', query);
    }
  }
});

// Shared singleton across all environments
globalForPostgres.sqlInstance = sqlInstance;

export default sqlInstance;
export { sqlInstance as sql };

// Health check function
export async function checkDatabaseHealth() {
  try {
    await sqlInstance`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
