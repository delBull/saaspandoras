export interface UtilityPhase {
    id: string;
    name: string;
    type: 'time' | 'amount'; // Trigger condition
    limit: number; // Duration in days or Amount in USD
    isActive: boolean;
}

export interface TokenomicsConfig {
    initialSupply: number;
    price: number; // Initial price in USD (or ETH depending on implementation)
    votingPowerMultiplier: number; // Governance weight per token
}

export interface DeploymentConfig {
    phases: UtilityPhase[];
    tokenomics: TokenomicsConfig;
    accessCardImage?: string; // URL or CID (optional for now)
}

export const DEFAULT_PHASES: UtilityPhase[] = [
    { id: 'community', name: 'Fase de Comunidad Inicial', type: 'time', limit: 30, isActive: true },
    { id: 'expansion', name: 'Fase de Expansión', type: 'amount', limit: 100000, isActive: true }
];

export const DEFAULT_TOKENOMICS: TokenomicsConfig = {
    initialSupply: 1000000,
    price: 0.1,
    votingPowerMultiplier: 1,
};
