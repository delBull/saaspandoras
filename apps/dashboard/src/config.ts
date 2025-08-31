import { base, sepolia } from "thirdweb/chains";

// --- 1. Lee todas las variables de entorno necesarias ---
const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME;
const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
const poolContractAddress = process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS;

// --- 2. Valida que las variables de entorno existan ---
if (!chainName) {
  throw new Error("ERROR: La variable de entorno NEXT_PUBLIC_CHAIN_NAME no está configurada.");
}
if (!nftContractAddress) {
  throw new Error("ERROR: La variable de entorno NEXT_PUBLIC_NFT_CONTRACT_ADDRESS no está configurada.");
}
if (!poolContractAddress) {
  throw new Error("ERROR: La variable de entorno NEXT_PUBLIC_POOL_CONTRACT_ADDRESS no está configurada.");
}

// --- 3. Define un mapa de las cadenas que tu dApp soporta de forma segura ---
const supportedChains = {
  base: base,
  sepolia: sepolia,
} as const; // 'as const' hace que el objeto sea de solo lectura y los tipos más estrictos.

// Se crea un tipo basado en las claves del objeto anterior ('base' | 'sepolia')
type SupportedChainName = keyof typeof supportedChains;

// --- 4. Selecciona el objeto de la cadena activa de forma segura ---
const activeChainObject = supportedChains[chainName as SupportedChainName];

if (!activeChainObject) {
  throw new Error(`Configuración no válida para la red: "${chainName}". Revisa el valor de NEXT_PUBLIC_CHAIN_NAME. Valores soportados: 'base', 'sepolia'.`);
}

// --- 5. Exporta la configuración final con tipos 100% seguros ---
export const config = {
  chain: activeChainObject, // Ahora TypeScript sabe que esto es de tipo 'base' o 'sepolia', no 'any'
  nftContractAddress: nftContractAddress,
  poolContractAddress: poolContractAddress,
};