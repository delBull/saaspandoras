import { base, sepolia } from "thirdweb/chains";

// --- 1. Lee todas las variables de entorno necesarias ---
const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME;
const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
const poolContractAddress = process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS;

// --- 2. Valida que las variables de entorno existan ---
// Si alguna de estas variables falta, el build fallará con un error claro.
if (!chainName) {
  throw new Error("ERROR: La variable de entorno NEXT_PUBLIC_CHAIN_NAME no está configurada.");
}
if (!nftContractAddress) {
  throw new Error("ERROR: La variable de entorno NEXT_PUBLIC_NFT_CONTRACT_ADDRESS no está configurada.");
}
if (!poolContractAddress) {
  throw new Error("ERROR: La variable de entorno NEXT_PUBLIC_POOL_CONTRACT_ADDRESS no está configurada.");
}

// --- 3. Define un mapa de las cadenas que tu dApp soporta ---
const supportedChains = {
  base: base,
  sepolia: sepolia,
};

// --- 4. Selecciona el objeto de la cadena activa ---
// Hacemos un type assertion para poder buscar con una variable string.
const activeChainObject = (supportedChains as Record<string, any>)[chainName];

if (!activeChainObject) {
  throw new Error(`Configuración no válida para la red: "${chainName}". Revisa el valor de NEXT_PUBLIC_CHAIN_NAME. Valores soportados: 'base', 'sepolia'.`);
}

// --- 5. Exporta la configuración final y 100% dinámica ---
export const config = {
  chain: activeChainObject,
  nftContractAddress: nftContractAddress,
  poolContractAddress: poolContractAddress,
};