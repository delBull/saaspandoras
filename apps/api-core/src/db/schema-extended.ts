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
    index,
    uuid
} from "drizzle-orm/pg-core";

// ============================================
// TENANT CONFIGURATION (Multi-Tenant Support)
// ============================================

/**
 * Tenants table - Represents different DAOs or white-label instances
 * Each tenant has its own gating rules and configuration
 */
export const tenants = pgTable("tenants", {
    id: varchar("id", { length: 100 }).primaryKey(), // e.g., 'dao-xyz', 'pandoras-main'
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    
    // Gating Configuration (JSON)
    // {
    //   nftContracts: [{ address: string, chainId: number, minBalance: number }],
    //   minTokenBalance: string,
    //   requiredRoles: string[],
    //   whitelistedAddresses: string[]
    // }
    config: jsonb("config").default({
        nftContracts: [],
        minTokenBalance: "0",
        requiredRoles: [],
        whitelistedAddresses: []
    }),
    
    // Active status
    isActive: boolean("is_active").default(true).notNull(),
    
    // Metadata
    metadata: jsonb("metadata").default({}),
    
    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    nameIndex: index("tenants_name_idx").on(table.name),
    activeIndex: index("tenants_active_idx").on(table.isActive),
}));

/**
 * Tenant User Roles - Links users to tenants with specific roles
 */
export const tenantUsers = pgTable("tenant_users", {
    id: uuid("id").defaultRandom().primaryKey(),
    
    // User reference
    userId: varchar("user_id", { length: 255 }).notNull(), // References users.id (wallet address)
    
    // Tenant reference
    tenantId: varchar("tenant_id", { length: 100 }).notNull(), // References tenants.id
    
    // Roles for this tenant
    roles: jsonb("roles").default([]), // ['admin', 'member', 'contributor', 'vip']
    
    // Custom permissions per user in this tenant
    permissions: jsonb("permissions").default({}),
    
    // Status
    isActive: boolean("is_active").default(true).notNull(),
    
    // Timestamps
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
    userTenantIndex: uniqueIndex("tenant_users_user_tenant_idx").on(table.userId, table.tenantId),
    tenantIndex: index("tenant_users_tenant_idx").on(table.tenantId),
}));

/**
 * NFT Ownership Cache - Reduces RPC calls by caching on-chain data
 */
export const nftOwnershipCache = pgTable("nft_ownership_cache", {
    id: uuid("id").defaultRandom().primaryKey(),
    
    // Contract reference
    contractAddress: varchar("contract_address", { length: 42 }).notNull(),
    chainId: integer("chain_id").notNull(),
    
    // Holder info
    holder: varchar("holder", { length: 42 }).notNull(),
    balance: varchar("balance", { length: 78 }).notNull(), // BigInt as string
    
    // Cache metadata
    lastChecked: timestamp("last_checked", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => ({
    contractHolderIndex: uniqueIndex("nft_cache_contract_holder_idx").on(table.contractAddress, table.chainId, table.holder),
    expiresIndex: index("nft_cache_expires_idx").on(table.expiresAt),
}));

/**
 * Audit Logs - Track all authentication and access events
 */
export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    
    // Event details
    event: varchar("event", { length: 50 }).notNull(), // 'login', 'refresh', 'logout', 'access_denied', 'rate_limit'
    category: varchar("category", { length: 50 }).notNull(), // 'auth', 'tenant', 'nft', 'api'
    
    // User context
    address: varchar("address", { length: 42 }), // Wallet address (can be null for failed attempts)
    tenantId: varchar("tenant_id", { length: 100 }), // Tenant context
    
    // Request context
    ip: varchar("ip", { length: 45 }).notNull(), // IPv6 compatible
    userAgent: text("userAgent"),
    
    // Result
    success: boolean("success").notNull(),
    errorCode: varchar("error_code", { length: 50 }), // e.g., 'INVALID_SIGNATURE', 'INSUFFICIENT_BALANCE'
    
    // Additional data
    metadata: jsonb("metadata").default({}),
    
    // Timestamp
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    addressIndex: index("audit_logs_address_idx").on(table.address),
    tenantIndex: index("audit_logs_tenant_idx").on(table.tenantId),
    eventIndex: index("audit_logs_event_idx").on(table.event),
    createdIndex: index("audit_logs_created_idx").on(table.createdAt),
}));

// ============================================
// TYPE DEFINITIONS
// ============================================

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type TenantUser = typeof tenantUsers.$inferSelect;
export type NewTenantUser = typeof tenantUsers.$inferInsert;
export type NFTOwnershipCache = typeof nftOwnershipCache.$inferSelect;
export type NewNFTOwnershipCache = typeof nftOwnershipCache.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// ============================================
// TENANT CONFIG TYPES
// ============================================

export interface NFTContractConfig {
    address: string;
    chainId: number;
    minBalance: number; // Minimum tokens required (default 1)
    method?: string; // Method to check (default: 'balanceOf')
}

export interface TenantConfig {
    nftContracts: NFTContractConfig[];
    minTokenBalance: string; // Minimum native token balance (in wei)
    requiredRoles: string[]; // Roles required from tenant_users
    whitelistedAddresses: string[]; // Always allowed addresses
    requireEmailVerification?: boolean;
    allowGuestAccess?: boolean;
}
