import { pgTable, serial, text, varchar, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const leads = pgTable("leads", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }),
	stageInterest: varchar("stage_interest", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	walletAddress: varchar("wallet_address", { length: 255 }),
});
