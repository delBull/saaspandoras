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
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const projectStatusEnum = pgEnum("project_status", [
  "draft",        // Borrador: Proyecto incompleto guardado por el solicitante
  "pending",      // Pendiente: Aplicación completa, esperando revisión
  "active_client", // Cliente Activo: Pagó Tier 1, fase de análisis
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
  availability: jsonb("availability"), // Configuración de agenda (días, horas, etc)
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
  registryContractAddress: varchar("registry_contract_address", { length: 42 }), // V2
  artifacts: jsonb("artifacts").default([]), // V2: Array of {type, address}
  protocolVersion: integer("protocol_version").default(1), // V1 = Legacy, V2 = Modular
  chainId: integer("chain_id"),
  deploymentStatus: varchar("deployment_status", { length: 50 }).default('pending'),
  w2eConfig: jsonb("w2e_config").default({}),
  pageLayoutType: varchar("page_layout_type", { length: 50 }), // access, identity, membership, coupon, reputation, yield

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
export const shortlinkTypeEnum = pgEnum("shortlink_type", ["redirect", "landing"]);

export const shortlinks = pgTable("shortlinks", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  destinationUrl: text("destination_url").notNull(), // Primary URL or Fallback
  title: varchar("title", { length: 255 }),
  description: text("description"),

  // Smart QR / Landing Page Features
  type: shortlinkTypeEnum("type").default("redirect").notNull(),
  landingConfig: jsonb("landing_config"), // { logo, slogan, links: [], social: {}, footer: {} }

  isActive: boolean("is_active").default(true).notNull(),
  createdBy: varchar("created_by", { length: 255 }).references(() => users.walletAddress),
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

// --- AUTH CHALLENGES TABLE ---
// Stores ephemeral nonces for SIWE authentication
export const authChallenges = pgTable("auth_challenges", {
  id: serial("id").primaryKey(),
  address: varchar("address", { length: 42 }).notNull(), // User's wallet address
  nonce: varchar("nonce", { length: 255 }).notNull().unique(), // The strict nonce
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Enforce 1 active nonce per address to prevent race conditions and clutter
  addressIndex: uniqueIndex("auth_challenges_address_idx").on(table.address),
}));

export const governanceVotes = pgTable("governance_votes", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").notNull(), // ID Referencia (On-Chain or DB), FK removed for hybrid support
  voterAddress: text("voter_address").notNull(),
  support: integer("support").notNull(), // 0=Against, 1=For, 2=Abstain
  signature: text("signature"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  unq: uniqueIndex("unique_vote").on(t.proposalId, t.voterAddress),
}));

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
export type AuthChallenge = typeof authChallenges.$inferSelect;

// =========================================================
// MARKETING OS TABLES
// =========================================================

export const triggerTypeEnum = pgEnum("trigger_type", [
  "manual",
  "auto_registration",
  "api_event",
]);

export const executionStatusEnum = pgEnum("execution_status", [
  "active",
  "paused",
  "completed",
  "intercepted",
  "failed"
]);

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  triggerType: triggerTypeEnum("trigger_type").default("manual").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  // Configuration for the campaign (flow steps, timing, messages)
  // Format: { steps: [{ day: 0, type: 'whatsapp', content: '...', conditions: {} }] }
  config: jsonb("config").notNull().default('{}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const marketingExecutions = pgTable("marketing_executions", {
  id: varchar("id", { length: 36 }).primaryKey(), // using uuid string
  userId: varchar("user_id", { length: 255 }), // Link to users table (optional)
  leadId: varchar("lead_id", { length: 36 }),  // Link to whatsapp leads (optional) (using varchar mostly for flexible linking)
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id).notNull(),
  status: executionStatusEnum("status").default("active").notNull(),
  currentStageIndex: integer("current_stage_index").default(0).notNull(),
  nextRunAt: timestamp("next_run_at"), // Critical for Cron

  // Execution Data
  data: jsonb("data").default({}).notNull(),
  history: jsonb("history").default([]).notNull(),
  metadata: jsonb("metadata").default({}).notNull(),

  error: text("error"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
// =========================================================
// PANDORA CORE INTEGRATIONS MODULE
// =========================================================

export const integrationEnvironmentEnum = pgEnum("integration_environment", [
  "staging",
  "production"
]);

export const integrationPermissionEnum = pgEnum("integration_permission", [
  "deploy",
  "read",
  "governance",
  "treasury"
]);

export const auditActorTypeEnum = pgEnum("audit_actor_type", [
  "integration",
  "admin",
  "system"
]);

export const webhookStatusEnum = pgEnum("webhook_status", [
  "pending",
  "sent",
  "failed"
]);

export const integrationClients = pgTable("integration_clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  environment: integrationEnvironmentEnum("environment").default("staging").notNull(),

  // Security
  apiKeyHash: text("api_key_hash").notNull(),
  keyFingerprint: varchar("key_fingerprint", { length: 255 }).notNull(), // for UI display/audit

  // Webhooks
  callbackUrl: text("callback_url"),
  callbackSecretHash: text("callback_secret_hash"),

  // Permissions & State
  permissions: jsonb("permissions").default([]).notNull(), // Array of permissions
  isActive: boolean("is_active").default(true).notNull(),

  // Audit
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorType: auditActorTypeEnum("actor_type").notNull(),
  actorId: varchar("actor_id", { length: 255 }).notNull(), // UUID or Wallet

  action: varchar("action", { length: 255 }).notNull(),
  resource: varchar("resource", { length: 255 }).notNull(),

  metadata: jsonb("metadata").default({}),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => integrationClients.id).notNull(),

  event: varchar("event", { length: 255 }).notNull(),
  payload: jsonb("payload").notNull(),

  status: webhookStatusEnum("status").default("pending").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Integrations Types
export type IntegrationClient = typeof integrationClients.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type WebhookEvent = typeof webhookEvents.$inferSelect;



// =========================================================
// SOVEREIGN SCHEDULER TABLES
// =========================================================

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "rescheduled"
]);

export const schedulingSlots = pgTable("scheduling_slots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(), // The host (Admin/Creator)
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  isBooked: boolean("is_booked").default(false).notNull(),
  type: varchar("type", { length: 50 }).default("30_min").notNull(), // '15_min', '30_min', '60_min'

  // Metadata
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const schedulingBookings = pgTable("scheduling_bookings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slotId: text("slot_id").references(() => schedulingSlots.id).notNull(),

  // Lead Info
  leadName: text("lead_name").notNull(),
  leadEmail: text("lead_email").notNull(),
  leadPhone: text("lead_phone"), // Optional if email preferred
  notificationPreference: varchar("notification_preference", { length: 20 }).default("email").notNull(), // 'email', 'whatsapp', 'both'

  // Status & Details
  status: bookingStatusEnum("status").default("pending").notNull(),
  meetingLink: text("meeting_link"), // Google Meet / Zoom generated or static
  notes: text("notes"), // User's comments/questions

  // Metadata
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancellationReason: text("cancellation_reason"),
});

export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type MarketingExecution = typeof marketingExecutions.$inferSelect;

// Scheduler Types
export type SchedulingSlot = typeof schedulingSlots.$inferSelect;
export type SchedulingBooking = typeof schedulingBookings.$inferSelect;

// =========================================================
// CLIENTS & PAYMENTS SYSTEM (CRM LITE & PAYMENT BRIDGE)
// =========================================================

export const clientStatusEnum = pgEnum("client_status", [
  "lead",         // Registered interest
  "negotiating",  // In conversation / Payment Link Sent
  "closed_won",   // Paid / Active
  "closed_lost",  // Rejected / Ghosted
  "churned"       // Former client
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "stripe",
  "crypto",
  "wire"
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
  "rejected"
]);

// 1. CLIENTS (CRM IDENTITY)
export const clients = pgTable("clients", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 255 }), // Link to platform user (optional initially)
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  name: varchar("name", { length: 255 }),
  walletAddress: varchar("wallet_address", { length: 42 }),

  // Segmentation
  source: varchar("source", { length: 50 }).default('manual'), // protocol, founders, manual
  package: varchar("package", { length: 50 }), // starter, pro, enterprise, custom
  status: clientStatusEnum("status").default("lead").notNull(),

  // Metadata
  metadata: jsonb("metadata").default('{}'),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. PAYMENT LINKS (THE BRIDGE)
export const paymentLinks = pgTable("payment_links", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()), // Public ID for URL
  clientId: text("client_id").references(() => clients.id).notNull(),

  // Configuration
  title: varchar("title", { length: 255 }).notNull(), // "Protocol Deployment - Initial Batch"
  description: text("description"),

  // Financials
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(), // USD
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),

  // Methods Enabled
  methods: jsonb("methods").default(['stripe', 'crypto', 'wire']).notNull(), // Array of enabled methods
  destinationWallet: varchar("destination_wallet", { length: 42 }), // Override for Crypto Payments

  // Lifecycle
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),

  createdBy: varchar("created_by", { length: 255 }), // Admin who created it
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. TRANSACTIONS (VALUE TRANSFER)
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  linkId: text("link_id").references(() => paymentLinks.id), // Optional: could be direct without link
  clientId: text("client_id").references(() => clients.id),

  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),

  method: paymentMethodEnum("method").notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),

  // Proof of Payment
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. SOW TEMPLATES
export const sowTemplates = pgTable("sow_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tier: varchar("tier", { length: 50 }).notNull(), // TIER_1, TIER_2, TIER_3
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  variables: jsonb("variables").default('[]'),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SOWTemplate = typeof sowTemplates.$inferSelect;
