// Domain DTOs and Value Objects for Growth OS

export type AssetType = 
  | 'DOCUMENT' 
  | 'MEDIA' 
  | 'LANDING' 
  | 'CALCULATOR' 
  | 'MEETING' 
  | 'EVENT' 
  | 'PODCAST' 
  | 'VIDEO'
  | 'COMMUNITY'
  | 'EXTERNAL_LINK';

export interface EventConfig {
  maxCapacity?: number;
  mapsLink?: string;
  meetingType?: 'PHYSICAL' | 'VIRTUAL' | 'CHOICE';
  durationMinutes?: number;
  bufferMinutes?: number;
  minAdvanceHours?: number;
  maxDaysInFuture?: number;
  availability?: any;
}

export interface MediaConfig {
  url?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  platform?: 'YOUTUBE' | 'VIMEO' | 'M3U8' | 'DIRECT';
}

export interface DocumentConfig {
  fileUrl?: string;
  fileSize?: number;
  format?: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'MD';
}

export interface LandingConfig {
  theme?: string;
  components?: string[];
  features?: string[];
}

export interface CalculatorConfig {
  formula?: string;
  inputs?: any[];
  outputs?: any[];
}

export interface AssetMetadata {
  event?: EventConfig;
  media?: MediaConfig;
  document?: DocumentConfig;
  landing?: LandingConfig;
  calculator?: CalculatorConfig;
  // Other domain-specific namespaces
  language?: 'es' | 'en' | 'pt';
  presenter?: string;
  [key: string]: any; // escape hatch if absolutely needed, but we prefer strict schemas
}

// ----------------------------------------------------
// Project Domain Configuration Interfaces
// ----------------------------------------------------

export interface ResourceHubConfig {
  markdownDocs?: Record<string, string>;
  communityDocs?: Record<string, string>;
  [key: string]: any;
}

export interface SovereignCalendarConfig {
  isActive?: boolean;
  scheduleMode?: string;
  [key: string]: any;
}

export interface NewsletterConfig {
  subscribers?: any[];
  campaigns?: any[];
  settings?: any;
}

export interface ProgressLogConfig {
  logs?: any[];
}

export interface ProjectMetadata {
  resourceHub?: ResourceHubConfig;
  sovereignCalendar?: SovereignCalendarConfig;
  newsletter?: NewsletterConfig;
  progressLogs?: ProgressLogConfig;
  [key: string]: any;
}

// ----------------------------------------------------
// Core Domain DTOs
// ----------------------------------------------------

export interface AttributionContext {
  trackerId?: string | null;
  campaignId?: string | null;
  assetId?: number | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  term?: string | null;
  referrer?: string | null;
  landingPage?: string | null;
  firstTouch?: string | null; // ISO Date String
  lastTouch?: string | null;  // ISO Date String
  sessionId?: string | null;
}

export interface PlatformAssetDTO {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  type: AssetType | string;
  metadata: AssetMetadata | any;
  visibility: 'public' | 'private' | 'restricted' | string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingCampaignDTO {
  id: number;
  projectId: number;
  name: string;
  type: string;
  status: string;
  objective: string | null;
  budget: string | null; // numeric string in drizzle
  startDate: Date | null;
  endDate: Date | null;
  metrics: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecisionDTO {
  id: string; // Identifier for the decision
  title: string; // E.g., 'Fracción Inversionista', 'Unidad Integral'
  subtitle: string; // E.g., '1. El Producto Core'
  description: string; // E.g., '$25,000 USD (500 Títulos)'
  benefits: string[]; // E.g., ['Nivel Embajador (+5% Yield)', 'Cierre rápido']
  commissionRate: string; // E.g., '4%'
  estimatedCommission: string; // E.g., '$1,000 USD'
  iconType: 'trending' | 'high_ticket' | 'fast_close'; // For UI rendering
}

/** @deprecated Use DecisionDTO instead */
export type RecommendationDTO = DecisionDTO;

export interface LeadActivityDTO {
  id: string;
  type: string; // 'signup', 'view_deck', 'click_calculator'
  timestamp: string; // ISO date string
  description: string; // Human readable description
  metadata: any;
}

/** @deprecated Use LeadActivityDTO instead */
export type LeadTimelineEventDTO = LeadActivityDTO;

export interface ProjectDTO {
  id: number;
  title: string;
  slug: string;
  config: ProjectMetadata;
  allowedDomains: string[] | any;
}

export interface ProjectEventDTO {
  id: number;
  projectId: number;
  type: string;
  title: string;
  date: Date | null;
  location: string | null;
  config: any;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectDomainAggregate {
  project: ProjectDTO;
  resources: PlatformAssetDTO[];
  events: ProjectEventDTO[];
  campaigns: MarketingCampaignDTO[];
}
