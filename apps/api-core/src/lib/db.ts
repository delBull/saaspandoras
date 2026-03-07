import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema.js";
import * as schemaExtended from "../db/schema-extended.js";

// Merge schemas
const fullSchema = {
    ...schema,
    ...schemaExtended
};

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
    console.warn("⚠️ Warning: DATABASE_URL is not set.");
}

// Disable prefetch for serverless environments (Railway / Vercel)
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema: fullSchema });
