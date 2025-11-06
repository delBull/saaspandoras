"use client";
import { z } from 'zod';

// Schema de validación completo basado en DB schema - Versión Utility
export const projectSchema = z.object({
  // Campos requeridos - Identidad de la Creación (temporalmente opcionales para pruebas)
  title: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(256, "El nombre es demasiado largo").optional(),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres").optional(),
  businessCategory: z.enum([
    'residential_real_estate',
    'commercial_real_estate',
    'tech_startup',
    'renewable_energy',
    'art_collectibles',
    'intellectual_property',
    'defi',
    'gaming',
    'metaverse',
    'music_audio',
    'sports_fan_tokens',
    'education',
    'healthcare',
    'supply_chain',
    'infrastructure',
    'social_networks',
    'carbon_credits',
    'insurance',
    'prediction_markets',
    'other'
  ]).optional(),

  // Campos opcionales - Identidad
  tagline: z.string().max(140, "El eslogan es demasiado largo").optional(),
  logoUrl: z.string().optional().or(z.literal("")),
  coverPhotoUrl: z.string().optional().or(z.literal("")),
  videoPitch: z.string().url("URL de video inválida").max(512).optional().or(z.literal("")),

  // Comunidad y Conexiones
  website: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  whitepaperUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  twitterUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  discordUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  telegramUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  linkedinUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),

  // Recursos y Artefactos
  targetAmount: z.union([z.number().min(1), z.string()]).optional(),
  totalValuationUsd: z.number().min(0).optional(),
  tokenType: z.enum(['erc20', 'erc721', 'erc1155']).optional(),
  totalTokens: z.number().min(1, "Debe haber al menos 1 token").optional(),
  tokensOffered: z.number().min(1, "Debe ofrecer al menos 1 token").optional(),
  tokenPriceUsd: z.number().min(0.01, "El precio debe ser mayor a 0.01 USD").optional(),
  estimatedApy: z.string().max(50).optional(),
  yieldSource: z.enum(['protocol_revenue', 'staking_rewards', 'liquidity_mining', 'governance_rewards', 'utility_fees', 'revenue_sharing', 'other']).optional(),

  // Estructura de Recompensa Recurrente
  stakingRewardsEnabled: z.boolean().optional(),
  stakingRewardsDetails: z.string().optional(),
  revenueSharingEnabled: z.boolean().optional(),
  revenueSharingDetails: z.string().optional(),
  workToEarnEnabled: z.boolean().optional(),
  workToEarnDetails: z.string().optional(),
  tieredAccessEnabled: z.boolean().optional(),
  tieredAccessDetails: z.string().optional(),
  discountedFeesEnabled: z.boolean().optional(),
  discountedFeesDetails: z.string().optional(),

  recurringRewards: z.string().optional(),

  fundUsage: z.string().optional(),
  lockupPeriod: z.string().max(100).optional(),

  // Equipo y Gobernanza
  teamMembers: z.array(z.object({
    name: z.string(),
    position: z.string(),
    linkedin: z.string().optional()
  })).optional(),
  advisors: z.array(z.object({
    name: z.string(),
    specialty: z.string()
  })).optional(),
  tokenDistribution: z.object({
    communitySale: z.number().min(0).max(100),
    teamFounders: z.number().min(0).max(100),
    treasury: z.number().min(0).max(100),
    marketing: z.number().min(0).max(100)
  }).optional(),
  treasuryAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Dirección de tesorería inválida").optional().or(z.literal("")),

  // Confianza y Transparencia
  legalStatus: z.string().optional(),
  fiduciaryEntity: z.string().max(256).optional(),
  valuationDocumentUrl: z.string().optional(),
  dueDiligenceReportUrl: z.string().url("URL inválida").optional().or(z.literal("")),

  // Parámetros Técnicos
  isMintable: z.boolean().optional(),
  isMutable: z.boolean().optional(),
  updateAuthorityAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Dirección de autoridad inválida").optional().or(z.literal("")),

  // Información del Creador
  applicantName: z.string().min(2, "El nombre es requerido").max(256),
  applicantPosition: z.string().max(256).optional(),
  applicantEmail: z.string().email("Email inválido").max(256),
  applicantPhone: z.string().max(50).optional(),
  applicantWalletAddress: z.string().optional(),

  // Campos adicionales
  integrationDetails: z.string().optional(),
  legalEntityHelp: z.boolean().optional(),

  // Verificación Final
  verificationAgreement: z.string().optional(),
});

// Tipos
export type ProjectFormData = z.infer<typeof projectSchema>;

export interface FormQuestion {
  id: keyof ProjectFormData;
  label: string;
  placeholder?: string;
  component: 'text-input' | 'textarea-input' | 'select-input' | 'number-input' | 'url-input' | 'file-input' | 'checkbox-input' | 'recurring-rewards-input';
  options?: { value: string; label: string }[];
  required?: boolean;
  maxLength?: number;
  info?: string;
  relatedField?: string;
}

export interface InputComponents {
  TextInput: React.ComponentType<any>;
  TextareaInput: React.ComponentType<any>;
  SelectInput: React.ComponentType<any>;
  NumberInput: React.ComponentType<any>;
  UrlInput: React.ComponentType<any>;
  FileInput: React.ComponentType<any>;
  CheckboxInput: React.ComponentType<any>;
  RecurringRewardsInput: React.ComponentType<any>;
}