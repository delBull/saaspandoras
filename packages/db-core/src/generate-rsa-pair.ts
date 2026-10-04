import { generateKeyPairSync } from 'crypto';

/**
 * 🔐 RSA-2048 Key Pair Generator for Vercel/JWT
 * ============================================
 * Este script genera un par de claves nuevas y las muestra en formato Base64.
 * Debes copiar el texto resultante y pegarlo en tus variables de Vercel.
 */

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: {
    type: 'pkcs8', // PKCS8 is the most compatible standard for Node.js/OpenSSL
    format: 'pem'
  },
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  }
});

console.log("\n================================================================================");
console.log("🚀 GENERACIÓN DE CLAVES EXITOSA");
console.log("================================================================================\n");

console.log("1️⃣  COPIA ESTO PARA TU VARIABLE: JWT_PRIVATE_KEY");
console.log("--------------------------------------------------------------------------------");
console.log(Buffer.from(privateKey).toString('base64'));
console.log("--------------------------------------------------------------------------------\n");

console.log("2️⃣  COPIA ESTO PARA TU VARIABLE: JWT_PUBLIC_KEY");
console.log("--------------------------------------------------------------------------------");
console.log(Buffer.from(publicKey).toString('base64'));
console.log("--------------------------------------------------------------------------------\n");

console.log("⚠️  IMPORTANTE: Asegúrate de copiar TODO el bloque de texto sin espacios adicionales.");
console.log("Una vez que pegues estas variables en Vercel, el login debería funcionar perfectamente.\n");
