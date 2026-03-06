import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "@/lib/database";
import * as schema from "./schema";

// Lazy initialization for Drizzle to prevent early DB connection
type DrizzleClient = PostgresJsDatabase<typeof schema>;
let dbInstance: DrizzleClient | undefined;

// Standard singleton pattern for Next.js to prevent connection exhaustion during HMR
const globalForDrizzle = globalThis as unknown as {
    dbInstance: PostgresJsDatabase<typeof schema> | undefined;
};

export const db = globalForDrizzle.dbInstance ?? drizzle(sql, { schema, logger: true });

if (process.env.NODE_ENV !== "production") {
    globalForDrizzle.dbInstance = db;
}
