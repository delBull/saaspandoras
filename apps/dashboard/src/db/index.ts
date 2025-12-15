import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "@/lib/database";
import * as schema from "./schema";

// Lazy initialization for Drizzle to prevent early DB connection
let dbInstance: ReturnType<typeof drizzle> | undefined;

function getDb() {
    if (!dbInstance) {
        dbInstance = drizzle(sql, { schema, logger: true });
    }
    return dbInstance;
}

// Proxy to forward calls to the lazy instance
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
    get(_target, prop) {
        return (getDb() as any)[prop];
    }
}) as ReturnType<typeof drizzle>;
