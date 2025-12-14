import postgres from "postgres";

// Connection pool configuration for better performance
// This prevents "too many clients" errors by reusing connections
// Connection pool configuration for better performance
// This prevents "too many clients" errors by reusing connections
const connectionString = process.env.DATABASE_URL || "";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ Warning: DATABASE_URL is not set. Database features will fail.");
} else {
  console.log("✅ Database initialized with connection string length:", process.env.DATABASE_URL.length);
}

// Determine if we are in a production-like environment (staging or prod)
const isProduction = process.env.NODE_ENV === 'production';

// Create a connection pool with SSL support for production only
export const sql = postgres(connectionString, {
  max: 10, // Maximum 10 connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout 10 seconds
  prepare: false, // Disable prepared statements for compatibility
  ssl: isProduction ? 'require' : false, // SSL en producción (staging y main)
  debug: (connection, query, params) => {
    if (process.env.DEBUG_DB === 'true') {
      console.log('SQL:', query);
    }
  }
});

// Export for use in other files
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
