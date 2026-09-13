import pg from "pg";
const { Pool } = pg;

// Connection configuration for PostgreSQL Pool (Node.js runtime / Serverless Pooler)
// Connects to Neon via connection pooler (-pooler) with full interactive transaction support.
const DATABASE_URL = process.env.DATABASE_URL || "";
if (DATABASE_URL && !DATABASE_URL.includes("-pooler") && DATABASE_URL.includes("neon.tech")) {
  console.warn("⚠️ DATABASE_URL detected without '-pooler' suffix. Using pooler endpoint is strongly recommended for serverless workloads.");
}

// Standard Next.js caching mechanism for Serverless
const globalForDb = globalThis as unknown as {
  poolInstance: pg.Pool | undefined;
  sqlInstance: any | undefined;
};

export function createPool(): pg.Pool {
  if (!DATABASE_URL) {
    // Return a dummy proxy to allow static builds without crashing
    const dummyTarget = Object.create(Pool.prototype);
    return new Proxy(dummyTarget as pg.Pool, {
      get(_, prop) {
        if (prop === 'connect' || prop === 'query') {
          return async () => {
            throw new Error("DATABASE_URL environment variable is not set.");
          };
        }
        if (prop === 'on') {
          return () => dummyTarget;
        }
        return Reflect.get(dummyTarget, prop);
      },
    });
  }

  const isLocal = DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1");

  return new Pool({
    connectionString: DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

export function getPool(): pg.Pool {
  if (!globalForDb.poolInstance) {
    globalForDb.poolInstance = createPool();
  }
  return globalForDb.poolInstance;
}

export const pool = getPool();

// Type alias to satisfy typescript for legacy tagged template sql calls
export type LegacySql = ((strings: TemplateStringsArray | string, ...values: any[]) => Promise<any[]>) & {
  query: (text: string, params?: any[]) => Promise<any>;
  transaction?: any;
};

export function createSqlFunction(p: pg.Pool): LegacySql {
  const sqlFn = async (strings: TemplateStringsArray | string, ...values: any[]) => {
    if (typeof strings === "string") {
      const params = values[0] && Array.isArray(values[0]) ? values[0] : values;
      const res = await p.query(strings, params);
      return res.rows;
    }
    let queryText = "";
    for (let i = 0; i < strings.length; i++) {
      queryText += strings[i];
      if (i < values.length) {
        queryText += `$${i + 1}`;
      }
    }
    const res = await p.query(queryText, values);
    return res.rows;
  };

  sqlFn.query = async (text: string, params?: any[]) => {
    return p.query(text, params);
  };

  return sqlFn as LegacySql;
}

export const sqlInstance = (globalForDb.sqlInstance || createSqlFunction(pool)) as LegacySql;
globalForDb.sqlInstance = sqlInstance;

export default sqlInstance;
export { sqlInstance as sql };

// Health check function
export async function checkDatabaseHealth() {
  try {
    const currentPool = getPool();
    await currentPool.query("SELECT 1");
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
