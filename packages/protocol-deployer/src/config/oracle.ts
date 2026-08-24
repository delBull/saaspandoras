import { createWallet, privateKeyToAccount } from 'thirdweb/wallets';
import { createThirdwebClient } from 'thirdweb';

export const PANDORA_ORACLE_CONFIG = {
  // Wallet dedicada para operaciones SCaaS
  privateKey: process.env.PANDORA_ORACLE_PRIVATE_KEY,
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

// Crear wallet del oráculo (Lazy) — fail-closed: sin private key real no hay wallet (§4/§9C)
export const getPandoraOracleWallet = () => {
  const privateKey = process.env.PANDORA_ORACLE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('[Oracle] PANDORA_ORACLE_PRIVATE_KEY no está configurada. Fail-closed: no se crea wallet sin clave.');
  }

  const clientId = process.env.THIRDWEB_CLIENT_ID;
  if (!clientId) {
    throw new Error('[Oracle] THIRDWEB_CLIENT_ID no está configurada.');
  }

  // Crear cliente Thirdweb para el oráculo
  const oracleClient = createThirdwebClient({
    clientId
  });

  const wallet = privateKeyToAccount({
    privateKey,
    client: oracleClient
  });

  // Verificar que la dirección coincide
  if (PANDORA_ORACLE_CONFIG.address &&
    wallet.address.toLowerCase() !== PANDORA_ORACLE_CONFIG.address.toLowerCase()) {
    console.warn('⚠️ La dirección derivada de la private key no coincide con PANDORA_ORACLE_ADDRESS');
  }

  return wallet;
};


// La validación se realiza dentro de getPandoraOracleWallet cuando sea necesario

export default PANDORA_ORACLE_CONFIG;
