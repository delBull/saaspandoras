import { pgTable, index, uniqueIndex, serial, text, timestamp, boolean, unique, foreignKey, jsonb, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const status = pgEnum("Status", ['PENDING', 'CREATING', 'INITING', 'RUNNING', 'STOPPED', 'DELETED'])
export const subscriptionPlan = pgEnum("SubscriptionPlan", ['FREE', 'PRO', 'BUSINESS'])


export const customer = pgTable("Customer", {
	id: serial().primaryKey().notNull(),
	authUserId: text().notNull(),
	name: text(),
	plan: subscriptionPlan(),
	stripeCustomerId: text(),
	stripeSubscriptionId: text(),
	stripePriceId: text(),
	stripeCurrentPeriodEnd: timestamp({ precision: 3, mode: 'string' }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("Customer_authUserId_idx").using("btree", table.authUserId.asc().nullsLast().op("text_ops")),
	uniqueIndex("Customer_stripeCustomerId_key").using("btree", table.stripeCustomerId.asc().nullsLast().op("text_ops")),
	uniqueIndex("Customer_stripeSubscriptionId_key").using("btree", table.stripeSubscriptionId.asc().nullsLast().op("text_ops")),
]);

export const user = pgTable("User", {
	id: text().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: text(),
	email: text(),
	image: text(),
	walletAddress: text().notNull(),
	hasPandorasKey: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("User_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
	uniqueIndex("User_walletAddress_key").using("btree", table.walletAddress.asc().nullsLast().op("text_ops")),
]);

export const k8SClusterConfig = pgTable("K8sClusterConfig", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	location: text().notNull(),
	authUserId: text().notNull(),
	plan: subscriptionPlan().default('FREE'),
	network: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	status: status().default('PENDING'),
	delete: boolean().default(false),
}, (table) => [
	index("K8sClusterConfig_authUserId_idx").using("btree", table.authUserId.asc().nullsLast().op("text_ops")),
]);

export const whatsappUsers = pgTable("whatsapp_users", {
	id: text().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	phone: text().notNull(),
	name: text(),
	priorityLevel: text("priority_level").default('normal').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_whatsapp_users_phone").using("btree", table.phone.asc().nullsLast().op("text_ops")),
	index("idx_whatsapp_users_priority").using("btree", table.priorityLevel.asc().nullsLast().op("text_ops")),
	unique("whatsapp_users_phone_key").on(table.phone),
]);

export const whatsappSessions = pgTable("whatsapp_sessions", {
	id: text().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: text("user_id").notNull(),
	flowType: text("flow_type").notNull(),
	state: jsonb().default({}).notNull(),
	currentStep: integer("current_step").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_whatsapp_sessions_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")).where(sql`(is_active = true)`),
	index("idx_whatsapp_sessions_flow_type").using("btree", table.flowType.asc().nullsLast().op("text_ops")),
	index("idx_whatsapp_sessions_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [whatsappUsers.id],
			name: "whatsapp_sessions_user_id_fkey"
		}),
	unique("whatsapp_sessions_user_id_key").on(table.userId),
]);

export const whatsappMessages = pgTable("whatsapp_messages", {
	id: text().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	sessionId: text("session_id"),
	direction: text().notNull(),
	body: text(),
	messageType: text("message_type").default('text').notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_whatsapp_messages_direction").using("btree", table.direction.asc().nullsLast().op("text_ops")),
	index("idx_whatsapp_messages_session_id").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("idx_whatsapp_messages_timestamp").using("btree", table.timestamp.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [whatsappSessions.id],
			name: "whatsapp_messages_session_id_fkey"
		}),
]);
