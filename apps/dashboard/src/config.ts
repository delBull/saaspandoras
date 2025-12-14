import { base, sepolia } from "thirdweb/chains";

// --- 1. Lee todas las variables de entorno necesarias ---
// Detectar rama para fallback inteligente (Vercel expose these)
const branchName = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || process.env.VERCEL_GIT_COMMIT_REF || 'main';
const isStaging = branchName === 'staging';

// Default chain based on branch
const defaultChain = isStaging ? 'sepolia' : 'base';

const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME || defaultChain;
const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
const poolContractAddress = process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

// --- 2. Valida que las variables de entorno existan (Log instead of throw) ---
if (!process.env.NEXT_PUBLIC_CHAIN_NAME) {
  console.log(`ℹ️ Info: NEXT_PUBLIC_CHAIN_NAME not set. Detected branch '${branchName}', defaulting chain to '${chainName}'.`);
}
if (!process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS) console.warn("⚠️ Warning: NEXT_PUBLIC_NFT_CONTRACT_ADDRESS not set, using zero address");
if (!process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS) console.warn("⚠️ Warning: NEXT_PUBLIC_POOL_CONTRACT_ADDRESS not set, using zero address");

// --- 3. Define un mapa de las cadenas que tu dApp soporta de forma segura ---
const supportedChains = {
  base: base,
  sepolia: sepolia,
} as const;

// Se crea un tipo basado en las claves del objeto anterior ('base' | 'sepolia')
type SupportedChainName = keyof typeof supportedChains;

// --- 4. Selecciona el objeto de la cadena activa de forma segura ---
const activeChainObject = supportedChains[chainName as SupportedChainName] ?? base;

if (!supportedChains[chainName as SupportedChainName]) {
  console.error(`❌ Error: Invalid chain "${chainName}". Defaulting to base.`);
}

// --- 5. Exporta la configuración final con tipos 100% seguros ---
export const config = {
  chain: activeChainObject,
  nftContractAddress: nftContractAddress,
  poolContractAddress: poolContractAddress,
};