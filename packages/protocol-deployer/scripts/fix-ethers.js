#!/usr/bin/env node

/**
 * Script para asegurar que ethers v6 esté correctamente configurado
 * en el protocol-deployer después de la instalación
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing ethers configuration for protocol-deployer...');

// Verificar que estamos en el directorio correcto
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}

// Leer package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Verificar que ethers esté configurado correctamente
const ethersVersion = packageJson.dependencies?.ethers;
if (ethersVersion !== '6.8.1') {
  console.log('⚠️  Fixing ethers version in package.json...');
  if (!packageJson.dependencies) packageJson.dependencies = {};
  packageJson.dependencies.ethers = '6.8.1';

  // Asegurar overrides
  if (!packageJson.overrides) packageJson.overrides = {};
  packageJson.overrides.ethers = '6.8.1';

  // Escribir de vuelta
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Fixed ethers version to 6.8.1');
}

// Verificar que el .pnpmfile.cjs existe y está configurado
const pnpmfilePath = path.join(__dirname, '..', '..', '..', '.pnpmfile.cjs');
if (fs.existsSync(pnpmfilePath)) {
  console.log('✅ .pnpmfile.cjs exists and should handle ethers isolation');
} else {
  console.log('⚠️  .pnpmfile.cjs not found in root');
}

console.log('🎉 Ethers configuration fixed for protocol-deployer!');
console.log('💡 Protocol-deployer will use ethers v6.8.1');
console.log('💡 Other packages will use ethers v5.7.2');
