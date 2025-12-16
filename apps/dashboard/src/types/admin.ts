import type { calculateProjectCompletion } from "@/lib/project-utils";

export type ProjectStatus = "pending" | "approved" | "live" | "completed" | "rejected";

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
  businessCategory?: string;
  targetAmount: number;
  status: ProjectStatus;
  source?: string; // Identifies where project came from: 'web_form' | 'whatsapp_form'
  createdAt: string;
  completionData?: ReturnType<typeof calculateProjectCompletion>;
  // Due diligence info
  valuationDocumentUrl?: string;
  dueDiligenceReportUrl?: string;
  legalStatus?: string;
  fiduciaryEntity?: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  applicantWalletAddress?: string;
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
  projectCount: number;
  systemProjectsManaged?: number; // For super admins only

  // KYC related fields
  kycLevel: 'N/A' | 'basic';
  kycCompleted: boolean;
  kycData?: KYCData | null;
}

export type UserRole = "applicant" | "pandorian" | "admin";
