import { z } from "zod";

// Helper para parsear JSON de forma segura desde un string
const safeJsonParse = (val: unknown) => {
  if (typeof val !== "string") {
    // Si ya es un objeto (ej. en pruebas), lo dejamos pasar.
    return val;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    // Si el parseo falla, Zod se encargará del error.
    return val;
  }
};

export const projectApiSchema = z.object({
  // Sección 1
  title: z.string().min(3, "El título es requerido"),
  slug: z.string().optional(),
  description: z.string().min(10, "La descripción es requerida"),
  tagline: z.string().max(140).optional(),
  businessCategory: z.enum([
    "residential_real_estate",
    "commercial_real_estate",
    "tech_startup",
    "renewable_energy",
    "art_collectibles",
    "intellectual_property",
    "other"]).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  coverPhotoUrl: z.string().url().optional().or(z.literal("")),
  videoPitch: z.string().url().optional().or(z.literal("")),

  // Sección 2
  website: z.string().url().optional().or(z.literal("")),
  whitepaperUrl: z.string().url().optional().or(z.literal("")),
  twitterUrl: z.string().url().optional().or(z.literal("")),
  discordUrl: z.string().url().optional().or(z.literal("")),
  telegramUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  // Los campos de redes sociales individuales se combinan en el objeto 'socials' en el frontend
  // por lo que no los necesitamos aquí.

  // Sección 3
  targetAmount: z.coerce.number().min(0),
  totalValuationUsd: z.coerce.number().min(0).optional(),
  tokenType: z.enum(["erc20", "erc721", "erc1155"]).optional(),
  totalTokens: z.coerce.number().min(1).optional(),
  tokensOffered: z.coerce.number().min(1).optional(),
  tokenPriceUsd: z.coerce.number().min(0).optional(),
  estimatedApy: z.string().optional(),
  yieldSource: z.enum(["rental_income", "capital_appreciation", "dividends", "royalties", "other"]).optional(),
  lockupPeriod: z.string().optional(),
  fundUsage: z.string().optional(),

  // Sección 4 (Campos que vienen como JSON string)
  teamMembers: z.preprocess(
    safeJsonParse(["teamMembers"]),
    z.array(z.object({ name: z.string().min(1), position: z.string().min(1), linkedin: z.string().url().optional().or(z.literal("")) })).optional()
  ),
  advisors: z.preprocess(
    safeJsonParse(["advisors"]),
    z.array(z.object({ name: z.string().min(1), profile: z.string().optional() })).optional()
  ),
  tokenDistribution: z.preprocess(
    safeJsonParse(["tokenDistribution"]),
    z.object({
        publicSale: z.coerce.number().min(0).max(100).optional(),
        team: z.coerce.number().min(0).max(100).optional(),
        treasury: z.coerce.number().min(0).max(100).optional(),
        marketing: z.coerce.number().min(0).max(100).optional(),
    }).optional()
  ),
  contractAddress: z.string().optional(),
  treasuryAddress: z.string().optional(),

  // Sección 5
  legalStatus: z.string().optional(),
  valuationDocumentUrl: z.string().url().optional().or(z.literal("")),
  fiduciaryEntity: z.string().optional(),
  dueDiligenceReportUrl: z.string().url().optional().or(z.literal("")),

  // Sección 6
  isMintable: z.boolean().optional(),
  isMutable: z.boolean().optional(),
  updateAuthorityAddress: z.string().optional(),

  // Sección 7
  applicantName: z.string().min(1, "Nombre requerido").optional(),
  applicantPosition: z.string().optional(),
  applicantEmail: z.string().email("Email inválido").optional(),
  applicantPhone: z.string().optional(),
  verificationAgreement: z.boolean().refine(val => val === true, { message: "Debes aceptar el acuerdo." }),
});