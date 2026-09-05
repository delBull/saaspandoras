/**
 * Public Data Transfer Objects (DTOs) for Pandora's Growth OS.
 * 
 * These types define the strict boundary between the Consumer Experience Plane (B2C)
 * and the Business Operating Plane (Core API). 
 * 
 * DO NOT import internal backend types (e.g., Prisma models, Drizzle schemas, or 
 * internal server utilities) into this file.
 */

export interface PublicActivityDTO {
  id: string;
  title: string;
  description: string;
  reward: string;
  type: string;
  category: string;
  link?: string;
}

export interface PublicProposalDTO {
  id: number;
  proposalId: string;
  title: string;
  status: string;
}

export interface PublicCertificateDTO {
  isVerifiable: boolean;
  agreementId: string;
  agreementHash: string | null;
  legalPortalUrl: string | null;
  status: "certified" | "on_hold" | "pending";
  units: number;
  amount: number;
  date: string;
  isVirtual?: boolean;
}

export interface GlobalCertificateDTO {
  isVerifiable: boolean;
  totalUnits: number;
  totalAmount: number;
  globalPortalUrl: string;
  status: string;
}

export interface PublicPhaseDTO {
  id: string;
  name: string;
  status: string;
  allocation: number;
  sold: number;
  remaining: number;
  price: number | string;
  cryptoPrice: string | null;
  progress: number;
  isSoldOut: boolean;
}

export interface PublicDocumentDTO {
  id: string;
  title: string;
  category: string;
  intent: string;
  objective: string;
  url: string;
  rawCategory: string;
  rawStatus: string;
  rawVerification: string;
  contentPreview: { section: string; text: string }[];
}

export interface PhaseBreakdownDTO {
  id: string;
  name: string;
  price: number;
  titlesHeld: number;
  plusvalia: number;
  isActive: boolean;
}

export interface UserPortfolioDTO {
  totalTitles: number;
  currentTotalValueUsd: number;
  phaseBreakdown: PhaseBreakdownDTO[];
}

export interface PublicProjectMetadataDTO {
  agoraEnabled: boolean;
  estimatedApy: string;
  targetAmount: string;
  tokenPriceUsd: string;
  nextPhasePriceUsd: string;
  tokenPriceCrypto: string;
  deliveryDate: string;
  totalUnits: number;
  soldUnits: number;
  availableUnits: number;
  progressPercentage: number;
  phaseName: string;
  aiBotUrl: string | null;
  markdownDocs: string | null;
}

export interface PublicProjectStateDTO {
  title: string;
  slug: string;
  tagline: string | null;
  status: string;
  
  // Real-time Supply & Ownership
  currentSupply: number;
  holdersCount: number;
  treasuryDisplay: string;
  
  // User specific (Requires ?wallet=)
  userBalance: number;
  userVotingPower: number;
  userRewards: string;
  userRewardsValue: number;
  isWhitelisted: boolean;
  dbUserStatus: string;
  isGestor: boolean;
  gestorStatus: string;
  canClaim: boolean;
  
  // Modules
  activities: PublicActivityDTO[];
  governance: {
    activeProposalsCount: number;
    proposals: PublicProposalDTO[];
  };
  onboarding: {
    title: string;
    steps: { title: string; description: string }[];
  };
  
  // Compliance & Titles
  certificates: PublicCertificateDTO[];
  globalCertificate: GlobalCertificateDTO | null;
  
  // Ambassador Program
  isAmbassador: boolean;
  referralCode: string | null;
  ambassadorStats: {
    role: string;
    status: string;
    activationStep: string;
    trustScore: number;
    totalReferrals: number;
    directCommissions: number;
    residualYield: number;
  } | null;
  
  // Financial Portfolio
  userPortfolio: UserPortfolioDTO;
  
  // Metadata & Analytics
  legal: any; // Add specific legal config types if necessary
  knowledgeCenter: {
    isActive: boolean;
    url: string;
    briefings: any[];
  };
  documents: PublicDocumentDTO[];
  events: any[];
  resources: any[];
  phases: PublicPhaseDTO[];
  metadata: PublicProjectMetadataDTO;
  metrics: {
    urgency: string;
  };
  timestamp: string;
}
