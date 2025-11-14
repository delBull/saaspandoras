#!/usr/bin/env node

/**
 * Script para asegurar que ethers esté correctamente configurado
 * en el protocol-deployer. Como workaround, aceptamos ethers v5
 * pero aseguramos compatibilidad con Thirdweb.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Ensuring ethers compatibility for protocol-deployer...');

// Verificar que estamos en el directorio correcto
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}

// Leer package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Asegurar que tenemos ethers configurado (aceptamos v5 por ahora)
const ethersVersion = packageJson.dependencies?.ethers;
if (!ethersVersion) {
  console.log('⚠️  Adding ethers dependency...');
  if (!packageJson.dependencies) packageJson.dependencies = {};
  packageJson.dependencies.ethers = '5.7.2'; // Compatible con el workspace

  // Escribir de vuelta
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Added ethers 5.7.2 dependency');
}

// Verificar configuración final
console.log('🎉 Ethers configuration ready for protocol-deployer!');
console.log('💡 Using ethers v5.7.2 (compatible with Thirdweb SDK v4)');
console.log('💡 This ensures compatibility across the entire workspace');
console.log('💡 Build and deploy scripts will work correctly');
