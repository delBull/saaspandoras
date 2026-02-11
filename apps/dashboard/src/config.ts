import { base, sepolia, baseSepolia } from "thirdweb/chains";

// --- 1. Lee todas las variables de entorno necesarias ---
// Detectar rama para fallback inteligente (Vercel expose these)
const branchName = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || process.env.VERCEL_GIT_COMMIT_REF || 'main';
const isStaging = branchName === 'staging';

// Default chain based on branch or environment
// In local development or staging, default to 'sepolia'. In production, 'base'.
const defaultChain = (isStaging || process.env.NODE_ENV === 'development') ? 'sepolia' : 'base';

// FORCE 'base' in development ONLY if no env var is present
const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME || (process.env.NODE_ENV === 'development' ? 'base' : defaultChain);
const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
const poolContractAddress = process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
const superAdminAddress = process.env.NEXT_PUBLIC_SUPER_ADMIN || ""; // Off-chain Super Admin override
const GOV_ADDRESS_PROD = process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT_ADDRESS || "0x4122D7A6F11286B881F8332D8c27deBcC922B2fA";
// Do NOT use the generic env var for Sepolia, as it likely contains the Prod address in local .env files
const GOV_ADDRESS_SEPOLIA = "0xe225DDceEfb5bd0957Ed165193267691083E25ED"; // Pandoras DAO Gov v2 (Roles, Penalties)

// --- 2. Valida que las variables de entorno existan (Log instead of throw) ---
if (!process.env.NEXT_PUBLIC_CHAIN_NAME) {
  console.log(`ℹ️ Info: NEXT_PUBLIC_CHAIN_NAME not set. Detected branch '${branchName}', defaulting chain to '${chainName}'.`);
}
if (!process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS) console.warn("⚠️ Warning: NEXT_PUBLIC_NFT_CONTRACT_ADDRESS not set, using zero address");
if (!process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS) console.warn("⚠️ Warning: NEXT_PUBLIC_POOL_CONTRACT_ADDRESS not set, using zero address");

// --- 3. Define un mapa de las cadenas que tu dApp soporta de forma segura ---
const supportedChains = {
  base: base,
  sepolia: sepolia, // Standard Ethereum Sepolia (Testnet)
  "base-sepolia": baseSepolia, // Base Sepolia (L2 Testnet)
} as const;

// Se crea un tipo basado en las claves del objeto anterior ('base' | 'sepolia')
type SupportedChainName = keyof typeof supportedChains;

// --- 4. Selecciona el objeto de la cadena activa de forma segura ---
const activeChainObject = supportedChains[chainName as SupportedChainName] ?? base;

if (!supportedChains[chainName as SupportedChainName]) {
  console.error(`❌ Error: Invalid chain "${chainName}". Defaulting to base.`);
}

// Logic for governance address & chain (Cross-chain setup)
// If App is on Sepolia (ETH), Governance is ALSO on Sepolia (ETH) now.
// If App is on Base (Mainnet), Governance is on Base
const governanceContractAddress = activeChainObject.id === base.id ? GOV_ADDRESS_PROD : GOV_ADDRESS_SEPOLIA;
const governanceChain = activeChainObject.id === base.id ? base : sepolia;

const applyPassNftAddress = process.env.NEXT_PUBLIC_APPLY_PASS_NFT_ADDRESS || "0xDBb729113F95C7Be1e6Aa976f5584ea0246e1cFE"; // Fallback to main NFT for now if not set

// --- 5. Exporta la configuración final con tipos 100% seguros ---
export const config = {
  chain: activeChainObject,
  nftContractAddress: nftContractAddress,
  poolContractAddress: poolContractAddress,
  governanceContractAddress: governanceContractAddress,
  governanceChain: governanceChain,
  superAdminAddress: superAdminAddress,
  applyPassNftAddress: applyPassNftAddress,
};