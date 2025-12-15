import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "@/lib/database";
import * as schema from "./schema";

// Lazy initialization for Drizzle to prevent early DB connection
type DrizzleClient = PostgresJsDatabase<typeof schema>;
let dbInstance: DrizzleClient | undefined;

function getDb(): DrizzleClient {
    if (!dbInstance) {
        dbInstance = drizzle(sql, { schema, logger: true });
    }
    return dbInstance;
}

// Proxy to forward calls to the lazy instance
export const db = new Proxy({} as DrizzleClient, {
    get(_target, prop) {
        return (getDb() as any)[prop];
    }
}) as DrizzleClient;
