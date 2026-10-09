import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@saasfly/db-core";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
    console.warn("⚠️ Warning: DATABASE_URL is not set.");
}

const client = postgres(connectionString, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
});

const filteredSchema = Object.fromEntries(
    Object.entries(schema).filter(([k, v]) => 
        k !== 'db' && typeof v !== 'function'
    )
);

export const db = drizzle(client, { schema: filteredSchema as any });
export { schema };
