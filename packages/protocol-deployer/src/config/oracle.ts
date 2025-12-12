import { createWallet, privateKeyToAccount } from 'thirdweb/wallets';
import { createThirdwebClient } from 'thirdweb';

export const PANDORA_ORACLE_CONFIG = {
  // Wallet dedicada para operaciones SCaaS
  privateKey: process.env.PANDORA_ORACLE_PRIVATE_KEY || '',
  address: process.env.PANDORA_ORACLE_ADDRESS || '',

  // Configuración de gas
  gasLimit: 5000000,
  priorityFee: '2000000000', // 2 gwei

  // Networks soportadas
  networks: {
    base: 8453,
    sepolia: 11155111
  }
};

// Validar configuración
if (!PANDORA_ORACLE_CONFIG.privateKey) {
  console.warn('⚠️ PANDORA_ORACLE_PRIVATE_KEY no está configurada. Usando dummy para build.');
}

if (!PANDORA_ORACLE_CONFIG.address) {
  console.warn('⚠️ PANDORA_ORACLE_ADDRESS no está configurada.');
}

// Crear cliente Thirdweb para el oráculo
const oracleClient = createThirdwebClient({
  clientId: process.env.THIRDWEB_CLIENT_ID || "8a0dde1c971805259575cea5cb737530"
});

// Dummy key for build context if missing
const safePrivateKey = PANDORA_ORACLE_CONFIG.privateKey || "0x0000000000000000000000000000000000000000000000000000000000000001";

// Crear wallet del oráculo
export const pandoraOracleWallet = privateKeyToAccount({
  privateKey: safePrivateKey,
  client: oracleClient
});

// Verificar que la dirección coincide (solo si tenemos config real)
if (PANDORA_ORACLE_CONFIG.privateKey && PANDORA_ORACLE_CONFIG.address &&
  pandoraOracleWallet.address.toLowerCase() !== PANDORA_ORACLE_CONFIG.address.toLowerCase()) {
  console.warn('⚠️ La dirección derivada de la private key no coincide con PANDORA_ORACLE_ADDRESS');
}

export default PANDORA_ORACLE_CONFIG;
