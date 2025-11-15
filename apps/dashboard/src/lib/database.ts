import postgres from "postgres";

// Connection pool configuration for better performance
// This prevents "too many clients" errors by reusing connections
const connectionString = process.env.DATABASE_URL;

// DEBUG: Log the database URL to verify which one is being used
console.log('🐛 DATABASE_URL in use:', connectionString?.substring(0, 50) + '...');
console.log('🐛 Environment:', process.env.NODE_ENV);
console.log('🐛 Vercel Env:', process.env.VERCEL_ENV);

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Create a connection pool with optimized settings for local development
export const sql = postgres(connectionString, {
  max: 10, // Maximum 10 connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout 10 seconds
  prepare: false, // Disable prepared statements for compatibility
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
