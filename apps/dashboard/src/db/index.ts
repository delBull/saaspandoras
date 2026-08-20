import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { sql } from "../lib/database";
import * as schema from "./schema";

// Lazy initialization for Drizzle to prevent early DB connection
type DrizzleClient = NeonHttpDatabase<typeof schema>;
let dbInstance: DrizzleClient | undefined;

// Standard singleton pattern for Next.js to prevent connection exhaustion during HMR
const globalForDrizzle = globalThis as unknown as {
    dbInstance: NeonHttpDatabase<typeof schema> | undefined;
};

export const db = globalForDrizzle.dbInstance ?? drizzle(sql, { schema, logger: true });

// Shared singleton in all environments to prevent pool exhaustion in serverless
globalForDrizzle.dbInstance = db;

