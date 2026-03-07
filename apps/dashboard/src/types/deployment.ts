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
    initialSupply: number;
    price: number;
    votingPowerMultiplier: number;
    reserveSupply?: number;
}

export type NetworkType = 'sepolia' | 'base';

export type ProtocolLayoutType = 'Access' | 'Identity' | 'Membership' | 'Coupon' | 'Reputation' | 'Yield';

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

    // W2E Economic Schedule
    w2eConfig?: {
        phase1APY: number;
        phase2APY: number;
        phase3APY: number;
        royaltyBPS: number;
    };
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
    price: 0.1,
    votingPowerMultiplier: 1,
};
