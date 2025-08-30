import { base, sepolia } from "thirdweb/chains";

// 1. Lee la variable de entorno para determinar la red activa.
const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME;

// 2. Define la dirección FIJA para el contrato del Pool que se usa en el dashboard.
const POOL_CONTRACT_ADDRESS = "0x4122d7a6f11286b881f8332d8c27debcc922b2fa"; // Pool Mainnet

// 3. Define las configuraciones DINÁMICAS para PandorasKey en cada red.
const configurations = {
  base: {
    chain: base,
    nftContractAddress: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS_BASE || "",
  },
  sepolia: {
    chain: sepolia,
    nftContractAddress: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS_SEPOLIA || "",
  },
};

// 4. Selecciona la configuración activa (por defecto 'sepolia' para desarrollo).
const activeConfigKey = chainName === "base" ? "base" : "sepolia";
const activeChainConfig = configurations[activeConfigKey];

// 5. Combina la configuración de red activa con la dirección fija del pool y exporta.
export const config = {
  chain: activeChainConfig.chain,
  nftContractAddress: activeChainConfig.nftContractAddress,
  poolContractAddress: POOL_CONTRACT_ADDRESS,
};

// 6. Valida que la configuración sea correcta.
if (!config.chain || !config.nftContractAddress) {
  throw new Error(`Configuration not valid for chain: ${chainName}. Check your environment variables for the PandorasKey address.`);
}
