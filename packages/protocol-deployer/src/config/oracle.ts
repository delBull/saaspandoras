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
// Crear wallet del oráculo (Lazy)
export const getPandoraOracleWallet = () => {
  // Validar configuración solo al llamar
  if (!PANDORA_ORACLE_CONFIG.privateKey) {
    console.warn('⚠️ PANDORA_ORACLE_PRIVATE_KEY no está configurada. Usando dummy para build.');
  }

  if (!PANDORA_ORACLE_CONFIG.address) {
    console.warn('⚠️ PANDORA_ORACLE_ADDRESS no está configurada.');
  }

  const safePrivateKey = PANDORA_ORACLE_CONFIG.privateKey || "0x0000000000000000000000000000000000000000000000000000000000000001";

  // Crear cliente Thirdweb para el oráculo
  const oracleClient = createThirdwebClient({
    clientId: process.env.THIRDWEB_CLIENT_ID || "8a0dde1c971805259575cea5cb737530"
  });

  const wallet = privateKeyToAccount({
    privateKey: safePrivateKey,
    client: oracleClient
  });

  // Verificar que la dirección coincide
  if (PANDORA_ORACLE_CONFIG.privateKey && PANDORA_ORACLE_CONFIG.address &&
    wallet.address.toLowerCase() !== PANDORA_ORACLE_CONFIG.address.toLowerCase()) {
    console.warn('⚠️ La dirección derivada de la private key no coincide con PANDORA_ORACLE_ADDRESS');
  }

  return wallet;
};


// La validación se realiza dentro de getPandoraOracleWallet cuando sea necesario

export default PANDORA_ORACLE_CONFIG;
