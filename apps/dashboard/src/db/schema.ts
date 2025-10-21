import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  jsonb,
  pgEnum,
  boolean,
  uniqueIndex
} from "drizzle-orm/pg-core";

export const projectStatusEnum = pgEnum("project_status", [
  "draft",        // Borrador: Proyecto incompleto guardado por el solicitante
  "pending",      // Pendiente: Aplicación completa, esperando revisión
  "approved",     // Aprobado: Aprobado por admin, listo para ir live
  "live",         // Live: Activo y aceptando inversiones
  "completed",    // Completed: Financiación completada exitosamente
  "incomplete",   // No completado: Denegado por información faltante
  "rejected",     // Denegado: Rechazado definitivamente después de revisión
]);

export const tokenTypeEnum = pgEnum("token_type", [
  "erc20", // Token Fungible (ERC-20)
  "erc721", // NFT (ERC-721)
  "erc1155", // Híbrido (ERC-1155)
]);

export const yieldSourceEnum = pgEnum("yield_source", [
  "rental_income", // Rentas de Alquiler
  "capital_appreciation", // Plusvalía por Venta
  "dividends", // Dividendos de la Startup
  "royalties", // Regalías
  "other", // Otro
]);

export const administrators = pgTable("administrators", {
  id: serial("id").primaryKey(),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull().unique(),
  alias: varchar("alias", { length: 100 }),
  role: varchar("role", { length: 50 }).default('admin').notNull(),
  addedBy: varchar("added_by", { length: 42 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabla User existente en la base de datos - corregido nombre a mayúscula
export const users = pgTable("User", {
  id: varchar("id", { length: 255 }).primaryKey(), // Restaurado a varchar para coincidir con estructura existente
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  image: text("image"),
  walletAddress: varchar("walletAddress", { length: 42 }).unique(), // Restaurado nombre original
  hasPandorasKey: boolean("hasPandorasKey").default(false).notNull(),

  // KYC Related Fields
  kycLevel: varchar("kycLevel", { length: 20 }).default('basic').notNull(),
  kycCompleted: boolean("kycCompleted").default(false).notNull(),
  kycData: jsonb("kycData"),

  connectionCount: integer("connectionCount").default(1).notNull(),
  lastConnectionAt: timestamp("lastConnectionAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const businessCategoryEnum = pgEnum("business_category", [
  "residential_real_estate", // Bienes Raíces Residencial
  "commercial_real_estate", // Bienes Raíces Comercial
  "tech_startup", // Startup Tecnológica
  "renewable_energy", // Energías Renovables
  "art_collectibles", // Arte y Coleccionables
  "intellectual_property", // Propiedad Intelectual
  "other", // Otro
]);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  
  // Sección 1: Identidad del Proyecto
  title: varchar("title", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  logoUrl: text("logo_url"),
  coverPhotoUrl: text("cover_photo_url"),
  tagline: varchar("tagline", { length: 140 }), // Descripción corta
  description: text("description").notNull(), // Descripción larga
  businessCategory: businessCategoryEnum("business_category").default("other"), // Categoría de negocio
  videoPitch: varchar("video_pitch", { length: 512 }), // Enlace video pitch
  
  // Sección 2: Enlaces Externos y Comunidad
  website: varchar("website", { length: 512 }),
  whitepaperUrl: varchar("whitepaper_url", { length: 512 }), // Prospecto de inversión
  twitterUrl: varchar("twitter_url", { length: 512 }),
  discordUrl: varchar("discord_url", { length: 512 }),
  telegramUrl: varchar("telegram_url", { length: 512 }),
  linkedinUrl: varchar("linkedin_url", { length: 512 }),
  
  // Sección 3: Detalles de la Oferta (Tokenomics)
  targetAmount: decimal("target_amount", { precision: 18, scale: 2 }).notNull().default("0.00"),
  totalValuationUsd: decimal("total_valuation_usd", { precision: 18, scale: 2 }), // Valuación total
  tokenType: tokenTypeEnum("token_type").default("erc20"),
  totalTokens: integer("total_tokens"), // Supply total
  tokensOffered: integer("tokens_offered"), // Tokens en esta venta
  tokenPriceUsd: decimal("token_price_usd", { precision: 18, scale: 6 }), // Precio por token
  estimatedApy: varchar("estimated_apy", { length: 50 }), // APY ofertado
  yieldSource: yieldSourceEnum("yield_source").default("other"),
  lockupPeriod: varchar("lockup_period", { length: 100 }), // Periodo de lock-up
  fundUsage: text("fund_usage"), // Destino de los fondos
  
  // Sección 4: Equipo y Transparencia
  teamMembers: jsonb("team_members"), // Array de {name, position, linkedin}
  advisors: jsonb("advisors"), // Array de asesores
  tokenDistribution: jsonb("token_distribution"), // Distribución % tokens
  contractAddress: varchar("contract_address", { length: 42 }), // Dirección contrato
  treasuryAddress: varchar("treasury_address", { length: 42 }), // Tesorería
  
  // Sección 5: Seguridad y Auditoría
  legalStatus: text("legal_status"), // Estatus legal del activo
  valuationDocumentUrl: text("valuation_document_url"),
  fiduciaryEntity: varchar("fiduciary_entity", { length: 256 }),
  dueDiligenceReportUrl: text("due_diligence_report_url"),
  
  // Sección 6: Parámetros del Token
  isMintable: boolean("is_mintable").default(false),
  isMutable: boolean("is_mutable").default(false),
  updateAuthorityAddress: varchar("update_authority_address", { length: 42 }),
  
  // Sección 7: Contacto del Solicitante (Interno)
  applicantName: varchar("applicant_name", { length: 256 }),
  applicantPosition: varchar("applicant_position", { length: 256 }),
  applicantEmail: varchar("applicant_email", { length: 256 }),
  applicantPhone: varchar("applicant_phone", { length: 50 }),
  applicantWalletAddress: varchar("applicant_wallet_address", { length: 42 }),
  verificationAgreement: boolean("verification_agreement").default(false),
  
  // Campos existentes (mantener compatibilidad)
  imageUrl: text("image_url"),
  socials: jsonb("socials"), // Mantener para compatibilidad
  raisedAmount: decimal("raised_amount", { precision: 18, scale: 2 }).default("0.00"),
  returnsPaid: decimal("returns_paid", { precision: 18, scale: 2 }).default("0.00"),
  // --- AJUSTE 2: Estado por defecto corregido a 'draft' ---
  status: projectStatusEnum("status").default("draft").notNull(),

  // Campos para featured projects
  featured: boolean("featured").default(false).notNull(),
  featuredButtonText: varchar("featured_button_text", { length: 100 }).default("Learn More"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectsIndexes = {
  slugIndex: { columns: ["slug"], name: "slug_index" },
};

// Gamification Enums
export const eventTypeEnum = pgEnum("event_type", [
  "project_application_submitted",
  "project_application_approved",
  "investment_made",
  "user_registered",
  "daily_login",
  "referral_made",
  "profile_completed",
  "community_post",
  "course_started",
  "course_completed",
  "quiz_passed",
  "streak_milestone",
  "beta_access",
  "feature_unlock",
  "milestone_reached"
]);

export const eventCategoryEnum = pgEnum("event_category", [
  "projects",
  "investments",
  "community",
  "learning",
  "daily",
  "special"
]);

export const pointsCategoryEnum = pgEnum("points_category", [
  "project_application",
  "investment",
  "daily_login",
  "community",
  "special_event"
]);

export const achievementTypeEnum = pgEnum("achievement_type", [
  "first_steps",
  "investor",
  "community_builder",
  "tokenization_expert",
  "early_adopter",
  "high_roller"
]);

export const rewardTypeEnum = pgEnum("reward_type", [
  "token_discount",
  "badge",
  "priority_access",
  "bonus_points",
  "nft"
]);

// Gamification Tables
export const gamificationProfiles = pgTable("gamification_profiles", {
  id: serial("id").primaryKey(),
  // --- AJUSTE 4: Referencia a User.id (corregido nombre de tabla) ---
  userId: varchar("user_id", { length: 255 }).notNull().unique().references(() => users.id),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull(),

  // Points and Level System
  totalPoints: integer("total_points").default(0).notNull(),
  currentLevel: integer("current_level").default(1).notNull(),
  levelProgress: integer("level_progress").default(0).notNull(),
  pointsToNextLevel: integer("points_to_next_level").default(100).notNull(),

  // Project Statistics
  projectsApplied: integer("projects_applied").default(0).notNull(),
  projectsApproved: integer("projects_approved").default(0).notNull(),
  totalInvested: decimal("total_invested", { precision: 18, scale: 2 }).default("0.00").notNull(),

  // Community Statistics
  communityContributions: integer("community_contributions").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  totalActiveDays: integer("total_active_days").default(0).notNull(),
  referralsCount: integer("referrals_count").default(0).notNull(),

  // Social Features
  communityRank: integer("community_rank").default(0).notNull(),
  reputationScore: integer("reputation_score").default(0).notNull(),

  // Metadata
  lastActivityDate: timestamp("last_activity_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const gamificationEvents = pgTable("gamification_events", {
  id: serial("id").primaryKey(),
  // --- AJUSTE 4: Referencia a User.id (varchar para coincidir con estructura existente) ---
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  type: eventTypeEnum("type").notNull(),
  category: eventCategoryEnum("category").notNull(),
  points: integer("points").default(0).notNull(),

  // Context
  projectId: integer("project_id").references(() => projects.id),
  metadata: jsonb("metadata"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const userPoints = pgTable("user_points", {
  id: serial("id").primaryKey(),
  // --- AJUSTE 4: Referencia a User.id (varchar para coincidir con estructura existente) ---
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  category: pointsCategoryEnum("category").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 10 }).notNull(),
  type: achievementTypeEnum("type").notNull(),

  // Requirements
  requiredPoints: integer("required_points").default(0).notNull(),
  requiredLevel: integer("required_level").default(1).notNull(),
  requiredEvents: jsonb("required_events"), // Array of event types needed

  // Rewards
  pointsReward: integer("points_reward").default(0).notNull(),
  badgeUrl: text("badge_url"),

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  isSecret: boolean("is_secret").default(false).notNull(),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  // --- AJUSTE 4: Referencia a User.id (varchar para coincidir con estructura existente) ---
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),

  // Progress
  progress: integer("progress").default(0).notNull(),
  isUnlocked: boolean("is_unlocked").default(false).notNull(),
  unlockedAt: timestamp("unlocked_at"),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserAchievement: uniqueIndex("unique_user_achievement").on(table.userId, table.achievementId),
}));

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 10 }).notNull(),
  type: rewardTypeEnum("type").notNull(),

  // Requirements
  requiredPoints: integer("required_points").default(0).notNull(),
  requiredLevel: integer("required_level").default(1).notNull(),

  // Reward Value
  value: varchar("value", { length: 100 }).notNull(), // "10%", "100 tokens", etc.
  metadata: jsonb("metadata"), // Additional reward data

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  stock: integer("stock"), // null = unlimited
  claimedCount: integer("claimed_count").default(0).notNull(),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  // --- AJUSTE 4: Referencia a User.id (varchar para coincidir con estructura existente) ---
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  rewardId: integer("reward_id").references(() => rewards.id).notNull(),

  // Claim Status
  isClaimed: boolean("is_claimed").default(false).notNull(),
  claimedAt: timestamp("claimed_at"),
  claimTransactionId: varchar("claim_transaction_id", { length: 255 }),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Export types
export type Project = typeof projects.$inferSelect;
export type User = typeof users.$inferSelect;
export type GamificationProfile = typeof gamificationProfiles.$inferSelect;
export type GamificationEvent = typeof gamificationEvents.$inferSelect;
export type UserPointsRecord = typeof userPoints.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type UserReward = typeof userRewards.$inferSelect;
