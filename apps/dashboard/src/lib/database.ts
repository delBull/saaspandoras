import postgres from "postgres";

// Connection pool configuration for better performance
// This prevents "too many clients" errors by reusing connections
// Connection pool configuration for better performance
// This prevents "too many clients" errors by reusing connections
// Lazy initialization to prevent global side effects during build/import
let sqlInstance: ReturnType<typeof postgres> | undefined;

function getSql() {
  if (!sqlInstance) {
    const connectionString = process.env.DATABASE_URL || "";

    // Determine if we are in a production-like environment
    const isProduction = process.env.NODE_ENV === 'production';

    if (!connectionString) {
      console.warn("⚠️ Warning: DATABASE_URL is not set. Database features will fail.");
    } else {
      console.log("🔌 Lazy Initializing Database Connection... Length:", connectionString.length);
    }

    sqlInstance = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      ssl: isProduction ? 'require' : false,
      debug: (connection, query, params) => {
        if (process.env.DEBUG_DB === 'true') {
          console.log('SQL:', query);
        }
      }
    });
  }
  return sqlInstance;
}

// Proxy to forward calls to the lazy instance
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const sql = new Proxy(() => { }, {
  get(_target, prop) {
    return (getSql() as any)[prop];
  },
  apply(_target, _thisArg, args) {
    const instance = getSql();
    if (!instance) throw new Error("Database initialization failed");
    return (instance as any)(...args);
  }
}) as unknown as ReturnType<typeof postgres>;

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
