
import { getTargetAmount } from "../project-utils";

/**
 * Project Data Harmonizer
 * Centralizes the logic to resolve technical blockchain data (contracts, chainIds)
 * from various sources (main columns, artifacts array, w2eConfig) and ensures
 * consistent property naming across the application.
 */

export interface HarmonizedProject {
    // Basic Info
    id: number;
    title: string;
    slug: string;
    
    // Technical Addresses (Standardized)
    licenseContractAddress: string | null;
    license_contract_address: string | null;
    
    utilityContractAddress: string | null;
    utility_contract_address: string | null;
    
    governorContractAddress: string | null;
    governor_contract_address: string | null;
    
    treasuryAddress: string | null;
    treasury_address: string | null;
    
    registryContractAddress: string | null;
    registry_contract_address: string | null;
    
    votingContractAddress: string | null; // For legacy UI compatibility
    
    // Network Info
    chainId: number;
    chain_id: number;
    networkName: 'sepolia' | 'base';
    
    // Metadata/Config
    artifacts: any[];
    w2eConfig: any;
    protocolVersion: number;
    
    // Spread all other original fields
    [key: string]: any;
}

/**
 * Harmonizes a project object from the database to a standard format used by the UI and APIs.
 */
export function harmonizeProject(project: any): HarmonizedProject {
    if (!project) return project;

    const artifacts = Array.isArray(project.artifacts) 
        ? project.artifacts 
        : (typeof project.artifacts === 'string' ? JSON.parse(project.artifacts || '[]') : []);
    
    let w2eConfig = typeof project.w2eConfig === 'string' 
        ? JSON.parse(project.w2eConfig || '{}') 
        : (project.w2eConfig || {});

    // ✨ EMERGENCY NORMALIZATION: Ensure S'Narai prices are correct at the source
    // This fixes the API response for all consumers (Dashboard, Telegram, etc.)
    if (project.slug === 'snarai' || project.id === 12) {
        const normalize = (p: any) => {
            const currentPrice = Number(p.tokenPrice || p.price || 0);
            if (currentPrice < 0.0005) {
                const forcedPrice = (p.name || "").toLowerCase().includes('fundador') ? 0.0015 : 0.003;
                return { 
                    ...p, 
                    tokenPrice: forcedPrice, 
                    price: forcedPrice,
                    tokenAllocation: p.tokenAllocation || p.allocation || p.limit || p.amount || p.maxSupply || 0
                };
            }
            return p;
        };

        if (Array.isArray(artifacts)) {
            artifacts.forEach((a: any) => {
                if (Array.isArray(a.phases)) {
                    a.phases = a.phases.map(normalize);
                }
            });
        }
        if (Array.isArray(w2eConfig.phases)) {
            w2eConfig.phases = w2eConfig.phases.map(normalize);
        }
    }

    // 1. Resolve Chain ID
    // Priority: chainId field > chain_id field > network name string > environment default
    const rawChainId = project.chainId || project.chain_id || (project.network === 'base' ? 8453 : project.network === 'sepolia' ? 11155111 : null);
    
    // Environment detection for default fallback
    const isMainnetEnv = 
        (typeof window !== 'undefined' && window.location.hostname.includes('dash.pandoras.finance')) || 
        process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ||
        process.env.NODE_ENV === 'production';
    
    const finalChainId = rawChainId ? Number(rawChainId) : (isMainnetEnv ? 8453 : 11155111);
    const finalNetworkName = finalChainId === 8453 ? 'base' : 'sepolia';

    // 2. Resolve Contract Addresses (The "Truth" extractor)
    const findInArtifacts = (type: string) => {
        const found = artifacts.find((a: any) => 
            (a.type?.toLowerCase() === type.toLowerCase()) || 
            (a.name?.toLowerCase().includes(type.toLowerCase()))
        );
        return found?.address || null;
    };

    const license = project.licenseContractAddress || (project as any).license_contract_address || findInArtifacts('license') || findInArtifacts('vhora') || null;
    const utility = project.utilityContractAddress || (project as any).utility_contract_address || findInArtifacts('utility') || findInArtifacts('phi') || null;
    const governor = project.governorContractAddress || (project as any).governor_contract_address || project.votingContractAddress || findInArtifacts('governor') || findInArtifacts('governance') || null;
    const treasury = project.treasuryAddress || (project as any).treasury_address || findInArtifacts('treasury') || findInArtifacts('tesoreria') || null;
    const registry = project.registryContractAddress || (project as any).registry_contract_address || findInArtifacts('registry') || null;

    // 3. Construct Harmonized Object
    return {
        ...project,
        id: Number(project.id),
        
        // Casing Harmony
        licenseContractAddress: license,
        license_contract_address: license,
        
        utilityContractAddress: utility,
        utility_contract_address: utility,
        
        governorContractAddress: governor,
        governor_contract_address: governor,
        votingContractAddress: governor, // Legacy compatibility
        
        treasuryAddress: treasury,
        treasury_address: treasury,
        
        registryContractAddress: registry,
        registry_contract_address: registry,
        
        // Network Harmony
        chainId: finalChainId,
        chain_id: finalChainId,
        networkName: finalNetworkName,
        
        // Data Structure Harmony
        artifacts,
        w2eConfig,
        
        // Financial Harmony (Standardize naming for API)
        // If DB target is 0 or missing, use calculated amount from phases
        targetAmount: (Number(project.target_amount || project.targetAmount || project.goal) > 0)
            ? (project.target_amount || project.targetAmount || project.goal)
            : getTargetAmount({ ...project, artifacts, w2eConfig }),
        target_amount: (Number(project.target_amount || project.targetAmount || project.goal) > 0)
            ? (project.target_amount || project.targetAmount || project.goal)
            : getTargetAmount({ ...project, artifacts, w2eConfig }),
        raisedAmount: project.raised_amount || project.raisedAmount || "0.00",
        returnsPaid: project.returns_paid || project.returnsPaid || "0.00",

        protocolVersion: project.protocolVersion ? Number(project.protocolVersion) : (artifacts.length > 0 ? 2 : 1)
    };
}
