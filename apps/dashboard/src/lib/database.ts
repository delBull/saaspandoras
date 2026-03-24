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

// Standard Next.js Postgres caching mechanism for Serverless
const globalForPostgres = globalThis as unknown as {
  sqlInstance: ReturnType<typeof postgres> | undefined;
};

// Use a more resilient configuration for serverless
export const sqlInstance = globalForPostgres.sqlInstance || postgres(DATABASE_URL, {
  max: 10, // Recommended safe limit for serverless on Neon
  idle_timeout: 20, 
  connect_timeout: 5,
  prepare: false, 
  ssl: { rejectUnauthorized: false },
});

// Shared singleton across ALL environments to prevent pool exhaustion
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

/**
 * Surgical Retry Wrapper
 * Limit to 2 retries (3 total attempts) with short 100ms backoff
 * to avoid "Retry Storms" that worsen DB pressure.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 100
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown database error');
      
      // 🛡️ ELITE GUARD: Don't retry unique violations (handled by specific logic)
      if ((lastError as any).code === '23505') {
        throw lastError;
      }

      if (attempt === maxRetries) {
        console.error(`❌ Max retries (${maxRetries}) reached. Operation failed:`, lastError.message);
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt); 
      console.warn(`⚠️ DB Retry ${attempt + 1}/${maxRetries} (delay ${delay}ms):`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
