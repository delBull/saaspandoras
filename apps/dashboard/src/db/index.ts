import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "@/lib/database";
import * as schema from "./schema";

export const db = drizzle(sql, { schema, logger: true });
