export interface UtilityPhase {
    id: string;
    name: string;
    description?: string; // New: Description for the phase
    type: 'time' | 'amount'; // Trigger condition
    limit: number; // Duration in days or Amount in USD
    isActive: boolean;
    tokenAllocation?: number; // New: Tokens allocated to this phase
    tokenPrice?: number; // New: Price per token in this phase
    image?: string; // New: Artifact image (DataURI or URL)
    startDate?: string; // ISO Date string
    endDate?: string; // ISO Date string
    isSoftCap?: boolean; // If true, funds are returned if target not met ("All or Nothing")
}

export interface TokenomicsConfig {
    initialSupply: number;
    price: number; // Initial price in USD
    votingPowerMultiplier: number; // Governance weight per token
    reserveSupply?: number; // New: Supply retained by treasury/team
}

export interface DeploymentConfig {
    phases: UtilityPhase[];
    tokenomics: TokenomicsConfig;
    accessCardImage?: string; // URL or CID
    accessCardSupply?: number; // Optional supply limit for Access Cards
    w2eConfig?: { // New: Economic Schedule Limits
        phase1APY: number;
        phase2APY: number;
        phase3APY: number;
        royaltyBPS: number;
    };
}

export const DEFAULT_PHASES: UtilityPhase[] = [
    {
        id: 'community',
        name: 'Venta Privada (Comunidad)',
        description: 'Acceso exclusivo para early adopters con descuento especial.',
        type: 'time',
        limit: 15,
        isActive: true,
        tokenAllocation: 200000,
        tokenPrice: 0.08
    },
    {
        id: 'public',
        name: 'Venta Pública',
        description: 'Abierto al público general al precio de lista.',
        type: 'amount',
        limit: 500000,
        isActive: true,
        tokenAllocation: 300000,
        tokenPrice: 0.10
    }
];

export const DEFAULT_TOKENOMICS: TokenomicsConfig = {
    initialSupply: 1000000,
    price: 0.1,
    votingPowerMultiplier: 1,
};
