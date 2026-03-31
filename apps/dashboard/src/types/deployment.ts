// V2 Artifact Types
export type ArtifactType = 'Access' | 'Identity' | 'Membership' | 'Coupon' | 'Reputation' | 'Yield';

export const ARTIFACT_TYPE_META: Record<ArtifactType, { icon: string; label: string; description: string; tags: string }> = {
    Access: { icon: '🔑', label: 'Access Pass', description: 'Protocol entry pass. Standard transferable NFT.', tags: 'ERC721A, Transferable' },
    Identity: { icon: '🪪', label: 'Identity SBT', description: 'Non-transferable Soul-Bound Token. Tied to one wallet forever.', tags: 'ERC721A, SBT' },
    Membership: { icon: '🏷️', label: 'Membership', description: 'Recurring subscription NFT. Can be set with expiry.', tags: 'ERC721A, Expirable' },
    Coupon: { icon: '🎟️', label: 'Coupon', description: 'Single-use, burnable ticket or discount voucher.', tags: 'ERC721A, Burnable' },
    Reputation: { icon: '🏆', label: 'Reputation', description: 'Achievement badge. Non-transferable & non-burnable by default.', tags: 'SBT, Achievement' },
    Yield: { icon: '💰', label: 'Yield Token', description: 'Revenue-sharing token. Holders receive a share of protocol earnings.', tags: 'ERC721A, Yield' },
};

export interface ArtifactConfig {
    id: string;
    name: string;
    symbol: string;
    artifactType: ArtifactType;
    maxSupply: number;
    price: string; // ETH price as string e.g. "0.01"
    image?: string; // DataURI
    isPrimary?: boolean; // First artifact → licenseContractAddress
}

export interface UtilityPhase {
    id: string;
    name: string;
    description?: string;
    type: 'time' | 'amount';
    limit: number;
    isActive: boolean;
    tokenAllocation?: number;
    tokenPrice?: number;
    image?: string;
    startDate?: string;
    endDate?: string;
    isSoftCap?: boolean;
}

export interface TokenomicsConfig {
    initialSupply: number; // For V1 compatibility
    totalSupply?: number;  // Absolute supply (100%)
    price: number;
    votingPowerMultiplier: number;
    reserveSupply?: number; // Legacy Team Amount
    
    // New Allocation Model
    teamAllocationBps?: number;     // e.g., 1500 for 15%
    pandorasAllocationBps?: number; // e.g., 500 for 5%
    teamWallet?: string;
    pandorasWallet?: string;
}

export type NetworkType = 'sepolia' | 'base';

export type ProtocolLayoutType = 'Access' | 'Identity' | 'Membership' | 'Coupon' | 'Reputation' | 'Yield';

// Perks & Packages Configuration
export type PerkType = 'discount' | 'bonus_tokens' | 'exclusive_access' | 'extra_apy' | 'multiplier' | 'other';

export interface PerkConfig {
    id: string;
    name: string;
    description: string;
    type: PerkType;
    value?: string | number;
    bonusMultiplier?: number; // e.g. 1.1x for Residente
    monetaryValue?: number; // Tangible translation to USD
}

export interface PackageConfig {
    id: string;
    name: string;
    description: string;
    artifactCountThreshold: number;
    artifactIds: string[];
    perks: PerkConfig[];
    progressLabel?: string;
    unlockMessage?: string;
}

export interface TierConfig {
    id: string;
    name: string; // Explorador, Residente, VIP, etc.
    minArtifacts: number;

    perks: {
        nights?: number;
        yieldBoost?: number;
        discount?: number;
        vipAccess?: boolean;
        custom?: string[];
    };

    ui: {
        highlightColor?: string;
        badge?: string;
    };

    // Derived / UI Helpers (Optional but useful for internal dashboard state)
    description?: string;
    nextTierId?: string;
}

export interface DeploymentConfig {
    // V2 Core
    artifacts: ArtifactConfig[];
    network: NetworkType;
    pageLayoutType?: ProtocolLayoutType;

    // Token Economics
    phases: UtilityPhase[];
    tokenomics: TokenomicsConfig;
    accessCardImage?: string;
    accessCardSupply?: number;

    // Progression Economy
    tiers?: TierConfig[];
    packages?: PackageConfig[]; // Keep for backward compatibility during transition

    // W2E Economic Schedule
    w2eConfig?: {
        phase1APY: number;
        phase2APY: number;
        phase3APY: number;
        royaltyBPS: number;
    };

    // Emergency / Debug
    forceRedeploy?: boolean;
}


// ── Defaults ──────────────────────────────────────────────

export const DEFAULT_ARTIFACT = (name = 'Protocol Access', symbol = 'PACC', supply = 1000): ArtifactConfig => ({
    id: `artifact-${Date.now()}`,
    name,
    symbol,
    artifactType: 'Access',
    maxSupply: supply,
    price: '0',
    isPrimary: true,
});

export const DEFAULT_PHASES: UtilityPhase[] = [
    {
        id: 'community',
        name: 'Venta Privada (Comunidad)',
        description: 'Acceso exclusivo para early adopters con descuento especial.',
        type: 'time',
        limit: 15,
        isActive: true,
        tokenAllocation: 200000,
        tokenPrice: 0.08,
    },
    {
        id: 'public',
        name: 'Venta Pública',
        description: 'Abierto al público general al precio de lista.',
        type: 'amount',
        limit: 500000,
        isActive: true,
        tokenAllocation: 300000,
        tokenPrice: 0.10,
    }
];

export const DEFAULT_TOKENOMICS: TokenomicsConfig = {
    initialSupply: 1000000,
    totalSupply: 1000000,
    price: 0.1,
    votingPowerMultiplier: 1,
};
