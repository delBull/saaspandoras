import { createKysely } from "@vercel/postgres-kysely";

import type { DB } from "./prisma/types";

export { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

export * from "./prisma/types";
export * from "./prisma/enums";

// Fallback to dummy URL to prevent `createKysely` from throwing `missing_connection_string` 
// during Next.js static build phase when env vars are missing.
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || "postgres://default:default@localhost:5432/mock_db_for_build";

export const db = createKysely<DB>({
  connectionString,
});
