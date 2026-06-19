"use client";
import { z } from 'zod';

// Schema de validación completo basado en DB schema - Versión Utility Optimizada
export const projectSchema = z.object({
  // Campos requeridos - Identidad de la Creación
  title: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(256, "El nombre es demasiado largo"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  businessCategory: z.enum([
    'tech_startup',
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
  ]),

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
  whatsappPhone: z.string().max(20, "El número es demasiado largo").optional().or(z.literal("")),

  // Utilidad y Economía de la Creación - NUEVAS CLAVES
  protoclMecanism: z.string().min(10, "La descripción debe tener al menos 10 caracteres").optional(),
  artefactUtility: z.string().min(10, "La descripción debe tener al menos 10 caracteres").optional(),
  worktoearnMecanism: z.string().min(10, "La descripción debe tener al menos 10 caracteres").optional(),
  integrationPlan: z.boolean().optional(),

  // Información del Creador
  applicantName: z.string().min(2, "El nombre es requerido").max(256),
  applicantPosition: z.string().max(256).optional(),
  applicantEmail: z.string().email("Email inválido").max(256),
  applicantPhone: z.string().max(50).optional(),
  applicantWalletAddress: z.string().optional(),

  // Transparencia y Estructura (Legal y Técnica) - NUEVAS CLAVES
  legalStatus: z.enum([
    'individual',
    'llc',
    'corporation',
    'nonprofit',
    'cooperative',
    'dao',
    'not_formed',
    'other'
  ]),
  legalStatusDetails: z.string().optional(),
  monetizationModel: z.string().min(3, "El modelo de monetización es requerido").max(256),
  adquireStrategy: z.string().min(10, "La descripción debe tener al menos 10 caracteres").optional(),
  mitigationPlan: z.string().min(10, "La descripción debe tener al menos 10 caracteres").optional(),

  // Datos Bancarios (Opcional)
  bankBeneficiary: z.string().optional(),
  bankName: z.string().optional(),
  bankClabe: z.string().optional(),
});

// Tipos
export type ProjectFormData = z.infer<typeof projectSchema>;

export interface FormQuestion {
  id: keyof ProjectFormData;
  label: string;
  placeholder?: string;
  component: 'text-input' | 'textarea-input' | 'select-input' | 'number-input' | 'url-input' | 'file-input' | 'checkbox-input';
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
}
