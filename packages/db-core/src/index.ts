import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { getPool } from "./database";
import * as schema from "./schema";

// Lazy initialization for Drizzle with NodePgDatabase
type DrizzleClientBase = NodePgDatabase<typeof schema>;
export type DrizzleClient = Omit<DrizzleClientBase, 'execute'> & {
    execute: (query: any) => Promise<any[]>;
};

let dbInstance: DrizzleClient | undefined;

// Standard singleton pattern for Next.js to prevent connection exhaustion during HMR
const globalForDrizzle = globalThis as unknown as {
    dbInstance: DrizzleClient | undefined;
};

if (!globalForDrizzle.dbInstance) {
    const pool = getPool();
    const rawDb = drizzle(pool, { schema, logger: process.env.NODE_ENV === 'development' });
    
    // Monkey-patch execute to maintain backward compatibility
    // drizzle-orm/node-postgres execute() returns QueryResult with rows array
    const originalExecute = rawDb.execute.bind(rawDb);
    const patchedDb = Object.assign(rawDb, {
        execute: async (query: any) => {
            const result = await originalExecute(query);
            return (result as any).rows || result;
        }
    }) as unknown as DrizzleClient;
    
    globalForDrizzle.dbInstance = patchedDb;
}

export const db = globalForDrizzle.dbInstance!;


export * from "./schema";
export { sql, eq, and, or, inArray, notInArray, desc, asc, sum, count, ilike, like, gte, gt, lt, lte, isNull, isNotNull, ne } from "drizzle-orm";
export * from './retry';
