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

// Tabla users existente en la base de datos
export const users = pgTable("users", {
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
  "residential_real_estate", // Bienes Raíces Residenciales
  "commercial_real_estate", // Bienes Raíces Comerciales
  "tech_startup", // Tech Startup
  "renewable_energy", // Energías Renovables
  "art_collectibles", // Arte y Coleccionables
  "intellectual_property", // Propiedad Intelectual
  "defi", // DeFi (Finanzas Descentralizadas)
  "gaming", // Gaming y NFTs de Juegos
  "metaverse", // Metaverso y Real Estate Virtual
  "music_audio", // Música y NFTs de Audio
  "sports_fan_tokens", // Deportes y Fan Tokens
  "education", // Educación y Aprendizaje
  "healthcare", // Salud y Biotecnología
  "supply_chain", // Cadena de Suministro
  "infrastructure", // Infraestructura y DAO Tools
  "social_networks", // Redes Sociales Web3
  "carbon_credits", // Créditos de Carbono
  "insurance", // Seguros Paramétricos
  "prediction_markets", // Mercados de Predicción
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

  // Sección 3.1: Estructura de Recompensa Recurrente
  recurringRewards: text("recurring_rewards"), // Descripción de recompensas recurrentes
  stakingRewardsEnabled: boolean("staking_rewards_enabled").default(false),
  stakingRewardsDetails: text("staking_rewards_details"),
  revenueSharingEnabled: boolean("revenue_sharing_enabled").default(false),
  revenueSharingDetails: text("revenue_sharing_details"),
  workToEarnEnabled: boolean("work_to_earn_enabled").default(false),
  workToEarnDetails: text("work_to_earn_details"),
  tieredAccessEnabled: boolean("tiered_access_enabled").default(false),
  tieredAccessDetails: text("tiered_access_details"),
  discountedFeesEnabled: boolean("discounted_fees_enabled").default(false),
  discountedFeesDetails: text("discounted_fees_details"),

  // Sección 4: Equipo y Transparencia
  teamMembers: jsonb("team_members"), // Array de {name, position, linkedin}
  advisors: jsonb("advisors"), // Array de asesores
  tokenDistribution: jsonb("token_distribution"), // Distribución % tokens
  contractAddress: varchar("contract_address", { length: 42 }), // Dirección contrato
  treasuryAddress: varchar("treasury_address", { length: 42 }), // Tesorería

  // Sección 4.1: SCaaS Architecture (W2E Contracts)
  licenseContractAddress: varchar("license_contract_address", { length: 42 }),
  utilityContractAddress: varchar("utility_contract_address", { length: 42 }),
  loomContractAddress: varchar("loom_contract_address", { length: 42 }),
  governorContractAddress: varchar("governor_contract_address", { length: 42 }),
  chainId: integer("chain_id"),
  deploymentStatus: varchar("deployment_status", { length: 50 }).default('pending'),
  w2eConfig: jsonb("w2e_config").default({}),

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

  // Campos adicionales
  integrationDetails: text("integration_details"), // Detalles de integraciones
  legalEntityHelp: boolean("legal_entity_help").default(false), // Necesita ayuda con entidad legal

  // Campos existentes (mantener compatibilidad)
  imageUrl: text("image_url"),
  socials: jsonb("socials"), // Mantener para compatibilidad
  raisedAmount: decimal("raised_amount", { precision: 18, scale: 2 }).default("0.00"),
  returnsPaid: decimal("returns_paid", { precision: 18, scale: 2 }).default("0.00"),
  // Deployment & Contracts (Refs above)
  votingContractAddress: varchar("voting_contract_address", { length: 42 }), // For On-Chain Governance


  // --- AJUSTE 2: Estado por defecto corregido a 'draft' ---
  status: projectStatusEnum("status").default("draft").notNull(),

  // Campos para featured projects
  featured: boolean("featured").default(false).notNull(),
  featuredButtonText: varchar("featured_button_text", { length: 100 }).default("Dime más"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectsIndexes = {
  slugIndex: { columns: ["slug"], name: "slug_index" },
};

// Gamification Enums
export const eventTypeEnum = pgEnum("event_type", [
  "project_application_submitted",
  "project_application_approved",
  "protocol_deployed",
  "sale_certified",
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
  "milestone_reached",
  "dao_activated",
  "artifact_purchased",
  "staking_deposit",
  "proposal_vote",
  "rewards_claimed",
  "activity_completed",
  "forum_post",
  "access_card_acquired",
  "artifact_acquired"
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
  "high_roller",
  "creator",
  "dao_pioneer",
  "artifact_collector",
  "defi_starter",
  "governor",
  "yield_hunter"
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

// Sistema de Referidos basado en Wallet Addresses
export const referralSourceEnum = pgEnum("referral_source", [
  "direct", // Referido directo
  "link",   // Usando enlace personalizado
  "code",   // Usando código manual
  "social"  // De redes sociales/QRs
]);

export const referralStatusEnum = pgEnum("referral_status", [
  "pending",    // Aguardando acciones del referido
  "completed",  // Referido completó onboarding/recompensas
  "expired"     // Caducado o inválido
]);

export const userReferrals = pgTable("user_referrals", {
  id: serial("id").primaryKey(),
  referrerWalletAddress: varchar("referrer_wallet_address", { length: 42 }).notNull(),
  referredWalletAddress: varchar("referred_wallet_address", { length: 42 }).notNull(),
  referralSource: referralSourceEnum("referral_source").default("direct"),

  // Estado del referido
  status: referralStatusEnum("status").default("pending"),
  referrerPointsAwarded: boolean("referrer_points_awarded").default(false),
  referredPointsAwarded: boolean("referred_points_awarded").default(false),

  // Progreso del referido
  referredCompletedOnboarding: boolean("referred_completed_onboarding").default(false),
  referredFirstProject: boolean("referred_first_project").default(false),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  referrerBonusDate: timestamp("referrer_bonus_date"),
  referredBonusDate: timestamp("referred_bonus_date"),
}, (table) => ({
  uniqueReferral: uniqueIndex("unique_user_referral").on(
    table.referrerWalletAddress,
    table.referredWalletAddress
  ),
}));

// --- WHATSAPP BOT SUPPORT TABLE ---
// Estado conversacional para usuarios usando el formulario por WhatsApp
// --- SHORTLINKS MANAGEMENT TABLES ---
// Shortlinks personalizados creados por admins
export const shortlinks = pgTable("shortlinks", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  destinationUrl: text("destination_url").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: varchar("created_by", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- SHORTLINKS ANALYTICS TABLES ---
// Tracking de clicks en shortlinks para marketing analytics
export const shortlinkEvents = pgTable("shortlink_events", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull(),              // 'w' para /w
  domain: varchar("domain", { length: 100 }),                  // pandoras.finance, pbox.dev
  ip: varchar("ip", { length: 45 }),                           // IPv4/IPv6
  userAgent: text("user_agent"),                                // Navegador/device
  referer: text("referer"),                                     // URL de origen
  utmSource: varchar("utm_source", { length: 100 }),           // google, facebook, etc.
  utmMedium: varchar("utm_medium", { length: 100 }),           // cpc, social, email
  utmCampaign: varchar("utm_campaign", { length: 100 }),       // campaign_name
  utmTerm: varchar("utm_term", { length: 100 }),               // keywords
  utmContent: varchar("utm_content", { length: 100 }),         // content variation
  deviceType: varchar("device_type", { length: 50 }),          // mobile, desktop, tablet
  browser: varchar("browser", { length: 100 }),                // chrome, safari, etc.
  country: varchar("country", { length: 10 }),                 // MX, US, ES
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- WHATSAPP BOT SUPPORT TABLES ---

// Tabla para el flujo conversacional actual (33 preguntas)
export const whatsappApplicationStates = pgTable("whatsapp_application_states", {
  id: serial("id").primaryKey(),
  userPhone: varchar("user_phone", { length: 20 }).notNull().unique(), // Número de WhatsApp del usuario
  wallet: varchar("wallet", { length: 42 }), // Wallet cuando se completa sección de solicitante
  currentStep: integer("current_step").default(0).notNull(), // Paso actual en el formulario (36 preguntas)
  answers: jsonb("answers").default({}).notNull(), // Respuestas acumuladas
  completed: boolean("completed").default(false).notNull(), // Si terminó el formulario
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabla dedicada para el flujo de 8 preguntas (filtrado) - MANTENER EXISTENTE
export const whatsappPreapplyLeads = pgTable("whatsapp_preapply_leads", {
  id: serial("id").primaryKey(),
  userPhone: varchar("user_phone", { length: 20 }).notNull(), // Número de WhatsApp del usuario
  step: integer("step").default(0).notNull(), // Paso actual (0-7 para las 8 preguntas)
  status: varchar("status", { length: 20 }).default("in_progress").notNull(), // in_progress|completed|pending|approved|rejected
  answers: jsonb("answers").default({}).notNull(), // Respuestas de las 8 preguntas
  applicantName: varchar("applicant_name", { length: 256 }), // Extraído de respuesta Q3
  applicantEmail: varchar("applicant_email", { length: 256 }), // Extraído de respuesta Q3
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniquePhone: uniqueIndex("unique_whatsapp_lead_phone").on(table.userPhone),
}));

// --- MULTI-FLOW SYSTEM TABLES --- (NUEVO SISTEMA)

// Tabla: whatsapp_users - Identidad base del usuario WhatsApp
export const whatsappUsers = pgTable("whatsapp_users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()), // UUID
  phone: text("phone").notNull().unique(), // "5213222741987"
  name: text("name"), // opcional, se puede extraer de respuestas
  priorityLevel: text("priority_level").default("normal").notNull(), // 'high', 'normal', 'support'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Tabla: whatsapp_sessions - Conversaciones activas con estado dinámico
export const whatsappSessions = pgTable("whatsapp_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()), // UUID
  userId: text("user_id").references(() => whatsappUsers.id).notNull(),
  flowType: text("flow_type").notNull(), // "eight_q", "high_ticket", "support", "human"
  state: jsonb("state").default({}).notNull(), // datos del progreso específico del flujo
  currentStep: integer("current_step").default(0).notNull(), // pregunta actual (0-8 para eight_q)
  isActive: boolean("is_active").default(true).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  // Una sola sesión activa por usuario
});

// Tabla: whatsapp_messages - Bitácora completa para análisis y soporte humano
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()), // UUID
  sessionId: text("session_id").references(() => whatsappSessions.id),
  direction: text("direction").notNull(), // "incoming" / "outgoing"
  body: text("body"),
  messageType: text("message_type").default("text").notNull(), // "text", "image", "audio"
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
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
export type UserReward = typeof userRewards.$inferInsert;
export type UserReferral = typeof userReferrals.$inferSelect;

// WhatsApp Multi-Flow Types - SISTEMA MULTI-FLOW
export type WhatsAppUser = typeof whatsappUsers.$inferSelect;
export type WhatsAppSession = typeof whatsappSessions.$inferSelect;
export type WhatsAppMessage = typeof whatsappMessages.$inferSelect;

// WhatsApp Legacy Types - MANTENER EXISTENTES
export type WhatsAppApplicationState = typeof whatsappApplicationStates.$inferSelect;
export type WhatsAppPreapplyLead = typeof whatsappPreapplyLeads.$inferSelect;



// --- GOVERNANCE CALENDAR TABLES ---

export const governanceEventTypeEnum = pgEnum("governance_event_type", [
  "on_chain_proposal", // Propuesta oficial on-chain
  "off_chain_signal",  // Señalización off-chain (Snapshot, etc.)
  "meeting",           // Reunión de gobernanza/AMA
  "update"             // Actualización de protocolo
]);

export const governanceEventStatusEnum = pgEnum("governance_event_status", [
  "scheduled", // Programado futuro
  "active",    // Actualmente activo
  "completed", // Finalizado
  "cancelled"  // Cancelado
]);

export const governanceEvents = pgTable("governance_events", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  type: governanceEventTypeEnum("type").default("on_chain_proposal").notNull(),
  status: governanceEventStatusEnum("status").default("scheduled").notNull(),
  externalLink: text("external_link"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- EMAIL METRICS TABLES ---

// Tabla para almacenar métricas de envío de emails desde Resend webhooks
export const emailMetrics = pgTable("email_metrics", {
  id: serial("id").primaryKey(),
  emailId: varchar("email_id", { length: 255 }).unique().notNull(),
  type: varchar("type", { length: 50 }).default('unknown').notNull(), // creator_welcome, founders, utility, etc.
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, approved, rejected, clicked, bounced, etc.
  recipient: varchar("recipient", { length: 255 }),
  emailSubject: text("email_subject"),
  clickedUrl: text("clicked_url"), // URL que se clickeó
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  bouncedAt: timestamp("bounced_at", { withTimezone: true }),
  complaintAt: timestamp("complaint_at", { withTimezone: true }),
  userAgent: text("user_agent"), // Para analytics de opened
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4/IPv6 para tracking
  metadata: jsonb("metadata").default({}), // Datos extras del webhook
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Indexes para consultas eficientes
export const emailMetricsIndexes = {
  emailIdIndex: { columns: ["email_id"], name: "email_metrics_email_id_idx" },
  typeStatusIndex: { columns: ["type", "status"], name: "email_metrics_type_status_idx" },
  statusIndex: { columns: ["status"], name: "email_metrics_status_idx" },
  recipientIndex: { columns: ["recipient"], name: "email_metrics_recipient_idx" },
  createdAtIndex: { columns: ["created_at"], name: "email_metrics_created_at_idx" },
};

// Shortlinks Types
export type ShortlinkEvent = typeof shortlinkEvents.$inferSelect;
export type Shortlink = typeof shortlinks.$inferSelect;

// Email Metrics Types
export type EmailMetric = typeof emailMetrics.$inferSelect;

// --- DAO ACTIVITIES & REWARDS TABLES ---

export const daoActivityTypeEnum = pgEnum("dao_activity_type", [
  "social",    // Retweet, Follow, Share
  "on_chain",  // Vote, Delegate, Hold Token
  "content",   // Write Article, Video
  "custom"     // Manual task
]);

export const daoActivityStatusEnum = pgEnum("dao_activity_status", [
  "active",
  "paused",
  "ended"
]);

export const daoActivitySubmissionStatusEnum = pgEnum("dao_activity_submission_status", [
  "pending",
  "approved",
  "rejected"
]);

export const daoActivities = pgTable("dao_activities", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),

  // Rewards
  rewardAmount: decimal("reward_amount", { precision: 18, scale: 6 }).default("0").notNull(),
  rewardTokenSymbol: varchar('reward_token_symbol', { length: 20 }).default('PBOX').notNull(), // PBOX, USDC, ETH
  category: varchar('category', { length: 50 }).default('social'), // 'social', 'labor', 'governance'
  requirements: jsonb('requirements').default({}), // For complex logic

  // Config
  type: daoActivityTypeEnum("type").default("custom").notNull(),
  status: daoActivityStatusEnum("status").default("active").notNull(),
  externalLink: text("external_link"),
  startedAt: timestamp('started_at', { withTimezone: true }), // For staking start

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const daoActivitySubmissions = pgTable("dao_activity_submissions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"), // Optional denormalization or required if API relies on it
  activityId: integer("activity_id").references(() => daoActivities.id).notNull(),
  userWallet: varchar("user_wallet", { length: 42 }).notNull(), // Wallet for payout

  // Proof
  proofData: text("proof_data"), // URL or text explanation
  status: daoActivitySubmissionStatusEnum("status").default("pending").notNull(),
  feedback: text("feedback"), // Rejection reason or cheer

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }), // For staking start
  statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }), // When status changed
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});


// DAO Chat / Forum Tables

export const daoThreads = pgTable("dao_threads", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(), // Assuming relation is managed manually or via ID for now to avoid circular deps if projects is defined earlier
  authorAddress: varchar("author_address", { length: 42 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).default('general'),
  isOfficial: boolean('is_official').default(false),
  isPinned: boolean('is_pinned').default(false),
  isLocked: boolean("is_locked").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export const daoPosts = pgTable("dao_posts", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => daoThreads.id, { onDelete: 'cascade' }),
  authorAddress: varchar("author_address", { length: 42 }).notNull(),
  content: text("content").notNull(),
  isSolution: boolean("is_solution").default(false),
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export const userBalances = pgTable("user_balances", {
  walletAddress: varchar("wallet_address", { length: 42 }).primaryKey(),
  pboxBalance: decimal("pbox_balance", { precision: 18, scale: 2 }).default("0").notNull(),
  usdcBalance: decimal("usdc_balance", { precision: 18, scale: 6 }).default("0").notNull(),
  ethBalance: decimal("eth_balance", { precision: 18, scale: 18 }).default("0").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Platform Settings (Global Configuration)
export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).unique().notNull(), // e.g., 'apply_gate_enabled'
  value: text("value"), // JSON string or text value
  description: text("description"), // For admin UI context
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: varchar("updated_by", { length: 42 }), // Admin wallet who changed it
});


// DAO Activities Types
export type DaoActivity = typeof daoActivities.$inferSelect;
export type DaoActivitySubmission = typeof daoActivitySubmissions.$inferSelect;

export type DaoThread = typeof daoThreads.$inferSelect;
export type DaoPost = typeof daoPosts.$inferSelect;
export type UserBalance = typeof userBalances.$inferSelect;
export type PlatformSetting = typeof platformSettings.$inferSelect;
