import { neon } from "@neondatabase/serverless";

// Connection configuration for Serverless (Neon HTTP Driver)
// This strictly prevents TCP connection exhaustion in Vercel Edge functions.
const DATABASE_URL = process.env.DATABASE_URL || "";
if (DATABASE_URL && !DATABASE_URL.includes("-pooler") && DATABASE_URL.includes("neon.tech")) {
  console.warn("⚠️ DATABASE_URL detected without '-pooler' suffix. Using Neon HTTP driver mitigates this, but pooler is still recommended for heavy backend tasks.");
}

// Standard Next.js caching mechanism for Serverless
const globalForNeon = globalThis as unknown as {
  sqlInstance: any | undefined;
};

// Use the highly resilient stateless HTTP driver for Vercel
// Safely bypass neon initialization during build if URL is missing to prevent crash
const neonClient = DATABASE_URL 
  ? neon(DATABASE_URL) 
  : (() => {
      // Return a dummy function that throws only if actually called at runtime
      const dummy = async () => { throw new Error("DATABASE_URL is not set"); };
      dummy.transaction = async () => { throw new Error("DATABASE_URL is not set"); };
      return dummy as any;
    })();

// Type alias to satisfy typescript for legacy postgres-js calls
export type LegacySql = ((strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>) & ReturnType<typeof neon>;

export const sqlInstance = (globalForNeon.sqlInstance || neonClient) as LegacySql;

// Shared singleton across ALL environments
globalForNeon.sqlInstance = sqlInstance;

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
