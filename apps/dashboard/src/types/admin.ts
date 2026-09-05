import type { calculateProjectCompletion } from "@/lib/project-utils";
import type { CanonicalProjectStatus } from "@/lib/project-status";

export type ProjectStatus = CanonicalProjectStatus;

export interface Project {
  id: string;
  title: string;
  description: string;
  website?: string;
  whitepaperUrl?: string;
  twitterUrl?: string;
  discordUrl?: string;
  telegramUrl?: string;
  linkedinUrl?: string;
  whatsappPhone?: string;
  logoUrl?: string;
  videoPitch?: string;
  businessCategory?: string;
  protoclMecanism?: string;
  artefactUtility?: string;
  worktoearnMecanism?: string;
  monetizationModel?: string;
  adquireStrategy?: string;
  mitigationPlan?: string;
  targetAmount: number;
  target_amount?: number | string;
  raisedAmount?: number | string;
  raised_amount?: number | string;
  tokensOffered?: number | string;
  tokenPriceUsd?: number | string;
  status: ProjectStatus;
  source?: string; // Identifies where project came from: 'web_form' | 'whatsapp_form'
  createdAt: string;
  completionData?: ReturnType<typeof calculateProjectCompletion>;
  // Due diligence info
  valuationDocumentUrl?: string;
  dueDiligenceReportUrl?: string;
  legalStatus?: string;
  fiduciaryEntity?: string;
  hermesBinding?: HermesBindingInfo | null;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  applicantWalletAddress?: string;
  applicantPosition?: string;
  // Featured project fields
  featured?: boolean;
  featuredButtonText?: string;
  coverPhotoUrl?: string;
  tagline?: string;
  slug?: string;
  // SCaaS / W2E Fields
  licenseContractAddress?: string;
  utilityContractAddress?: string;
  loomContractAddress?: string;
  governorContractAddress?: string;
  chainId?: number;
  deploymentStatus?: string;
  w2eConfig?: any;
  treasuryAddress?: string;
  totalTokens?: number;
  // Financial data
  totalValuationUsd?: number | string;
  estimatedApy?: string;
  // V2 Modular Fields
  registryContractAddress?: string;
  artifacts?: Array<{ type: string; address: string; name?: string }>;
  protocolVersion?: number;
  legalConfig?: any;
  ambassadorCommissionRate?: string;
  managerCommissionRate?: string;
  installedProducts?: string[];
}

export interface AdminData {
  id: number;
  walletAddress: string;
  alias?: string | null;
  role: string;
}

export interface KYCData {
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  taxId?: string; // SSN, TIN, etc.
  nationality?: string;
  occupation?: string;
  // Additional KYC fields as needed
  documents?: {
    idPhoto?: string;
    proofOfAddress?: string;
  };
}

export interface UserData {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  walletAddress: string;
  hasPandorasKey: boolean;
  connectionCount: number;
  lastConnectionAt: string;
  createdAt: string;
  role: UserRole;
  capabilities?: Record<string, boolean>;
  projectCount: number;
  systemProjectsManaged?: number; // For super admins only

  // KYC related fields
  kycLevel: 'N/A' | 'basic';
  kycCompleted: boolean;
  kycData?: KYCData | null;
  telegramId?: string | null;
  ritualCompletedAt?: string | null;
}

export type UserRole = "applicant" | "pandorian" | "user" | "super_admin" | "admin" | "operator" | "marketing" | "viewer";

export type HermesBindingMode = 'existing' | 'provisioned';

export interface HermesBindingInfo {
  hermesInstanceId: string | null;
  bindingMode: string | null;
  plan: string | null;
}

export interface ProjectHermesBinding {
  id: string;
  projectId: string | number;
  hermesInstanceId: string;
  mode: HermesBindingMode;
  status: 'active' | 'inactive' | 'paused';
  capabilities: string[];
  createdAt: Date;
  updatedAt: Date;
}
