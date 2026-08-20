import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { sql } from "../lib/database";
import * as schema from "./schema";

// Lazy initialization for Drizzle to prevent early DB connection
type DrizzleClientBase = NeonHttpDatabase<typeof schema>;
type DrizzleClient = Omit<DrizzleClientBase, 'execute'> & {
    execute: (query: any) => Promise<any[]>;
};

let dbInstance: DrizzleClient | undefined;

// Standard singleton pattern for Next.js to prevent connection exhaustion during HMR
const globalForDrizzle = globalThis as unknown as {
    dbInstance: DrizzleClient | undefined;
};

if (!globalForDrizzle.dbInstance) {
    const rawDb = drizzle(sql, { schema, logger: true });
    
    // Monkey-patch execute to maintain backward compatibility with postgres-js
    // drizzle-orm/neon-http execute() returns { rows: [] } instead of an array directly
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

