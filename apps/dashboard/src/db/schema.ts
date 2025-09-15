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
} from "drizzle-orm/pg-core";

export const projectStatusEnum = pgEnum("project_status", [
  "pending", // Aplicación recibida, en revisión.
  "approved", // Aprobado, pero aún no en vivo para inversión.
  "live", // Activo y aceptando inversiones.
  "completed", // Financiación completada.
  "rejected", // Aplicación rechazada.
]);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 1024 }),
  website: varchar("website", { length: 512 }),
  socials: jsonb("socials"),
  tokenizationType: varchar("tokenization_type", { length: 100 }),
  totalTokens: integer("total_tokens"),
  raisedAmount: decimal("raised_amount", { precision: 18, scale: 2 }).default("0.00"),
  targetAmount: decimal("target_amount", { precision: 18, scale: 2 }).default("0.00"),
  apy: varchar("apy", { length: 50 }),
  returnsPaid: decimal("returns_paid", { precision: 18, scale: 2 }).default("0.00"),
  status: projectStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});