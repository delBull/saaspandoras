import {
    pgTable,
    serial,
    varchar,
    timestamp,
    boolean,
    uniqueIndex,
    integer,
    text,
    jsonb
} from "drizzle-orm/pg-core";

// Users table (subset for Auth)
export const users = pgTable("users", {
    id: varchar("id", { length: 255 }).primaryKey(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).unique(),
    image: text("image"),
    walletAddress: varchar("walletAddress", { length: 42 }).unique(),
    hasPandorasKey: boolean("hasPandorasKey").default(false).notNull(),

    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    lastConnectionAt: timestamp("lastConnectionAt").defaultNow(),
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
