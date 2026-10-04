import { pgTable, serial, text, varchar, timestamp } from "drizzle-orm/pg-core"
import { sql } from "@saasfly/db-core"



export const leads = pgTable("leads", {
	id: serial("id").primaryKey().notNull(),
	name: text("name").notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	phone: varchar("phone", { length: 50 }),
	stageInterest: varchar("stage_interest", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	walletAddress: varchar("wallet_address", { length: 255 }),
});
