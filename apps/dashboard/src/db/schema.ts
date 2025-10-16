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

export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  image: text("image"),
  walletAddress: varchar("walletAddress", { length: 42 }).unique(),
  hasPandorasKey: boolean("hasPandorasKey").default(false).notNull(),

  // KYC Related Fields - New additions for user profile system
  kycLevel: varchar("kycLevel", { length: 20 }).default('basic').notNull(), // 'basic' or 'advanced'
  kycCompleted: boolean("kycCompleted").default(false).notNull(), // Whether advanced KYC is complete
  kycData: jsonb("kycData"), // JSON object with KYC information (phone, address, SSN, etc.)

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
  status: projectStatusEnum("status").default("pending").notNull(),

  // Campos para featured projects
  featured: boolean("featured").default(false).notNull(),
  featuredButtonText: varchar("featured_button_text", { length: 100 }).default("Learn More"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectsIndexes = {
  slugIndex: { columns: ["slug"], name: "slug_index" },
};

export type Project = typeof projects.$inferSelect;
