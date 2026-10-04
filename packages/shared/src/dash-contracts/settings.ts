/**
 * 📦 Dash Contracts — Hermes Settings DTOs
 * src/lib/dash-contracts/settings.ts
 */

export interface ApiKeyItemDTO {
  id: string;
  name: string;
  keyFingerprint: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface ChannelStatusDTO {
  provider: string;
  configured: boolean;
  status: 'READY' | 'NOT_CONFIGURED' | 'UNAVAILABLE';
}

export interface TenantSettingsDataDTO {
  title: string;
  tagline: string;
  description: string;
  website: string;
  whatsappPhone: string;
  telegramUrl: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  contactEmail?: string;
  channels?: ChannelStatusDTO[];
}

export interface GetSettingsResponseDTO {
  settings: TenantSettingsDataDTO;
  apiKeys: ApiKeyItemDTO[];
}

export interface CreateApiKeyResponseDTO {
  id: string;
  name: string;
  key: string;
  keyFingerprint: string;
  permissions: string[];
  createdAt: string;
}
