import {
    pgTable,
    serial,
    varchar,
    timestamp,
    boolean,
    uniqueIndex,
    integer,
    text,
    jsonb,
    uuid
} from "drizzle-orm/pg-core";

// Users table (subset for Auth)
export const users = pgTable("users", {
    id: varchar("id", { length: 255 }).primaryKey(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).unique(),
    image: text("image"),
    walletAddress: varchar("walletAddress", { length: 42 }).unique(),
    telegramId: varchar("telegram_id", { length: 255 }).unique(),
    status: varchar("status", { length: 20 }).default('ACTIVE').notNull(),
    hasPandorasKey: boolean("hasPandorasKey").default(false).notNull(),

    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    lastConnectionAt: timestamp("lastConnectionAt").defaultNow(),
});

export const sessions = pgTable("sessions", {
    id: uuid("id").primaryKey().defaultRandom(), // sid
    userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
    scope: varchar("scope", { length: 20 }).notNull(), // 'web' | 'telegram'
    ip: varchar("ip", { length: 45 }),
    userAgent: text("user_agent"),
    issuedAt: timestamp("issued_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    revokedReason: varchar("revoked_reason", { length: 100 }),
});

export const accountRecoveryTokens = pgTable("account_recovery_tokens", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    scope: varchar("scope", { length: 20 }).default('recovery').notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const securityEvents = pgTable("security_events", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).references(() => users.id),
    type: varchar("type", { length: 50 }).notNull(), // LOGIN, REVOKE, RECOVERY, LINK, UNLINK, FREEZE
    metadata: jsonb("metadata"),
    ip: varchar("ip", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Auth Challenges (Nonce)
export const authChallenges = pgTable("auth_challenges", {
    id: serial("id").primaryKey(),
    address: varchar("address", { length: 42 }).notNull(),
    nonce: varchar("nonce", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    addressIndex: uniqueIndex("auth_challenges_address_idx").on(table.address),
}));
