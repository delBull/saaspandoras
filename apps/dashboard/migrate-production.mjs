#!/usr/bin/env node

/**
 * Script para ejecutar migraciones de base de datos en producción
 * Este script ejecuta todas las migraciones de Drizzle que faltan en producción
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando migraciones de producción...');
console.log(`📁 Directorio de trabajo: ${__dirname}`);

// Verificar que estamos en el directorio correcto
const dashboardPath = __dirname;

try {
  // Verificar que existe el directorio de migraciones
  const fs = await import('fs');
  const migrationsPath = path.join(dashboardPath, 'drizzle');

  if (!fs.existsSync(migrationsPath)) {
    throw new Error(`Directorio de migraciones no encontrado: ${migrationsPath}`);
  }

  console.log('📊 Verificando migraciones disponibles...');
  const migrationFiles = fs.readdirSync(migrationsPath)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`📋 Migraciones encontradas: ${migrationFiles.length}`);
  migrationFiles.forEach(file => console.log(`   - ${file}`));

  // Ejecutar las migraciones
  console.log('📊 Ejecutando migraciones de Drizzle...');
  execSync('npx drizzle-kit migrate', {
    cwd: dashboardPath,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });

  console.log('✅ Migraciones completadas exitosamente');
  console.log('🔄 La aplicación debería reiniciarse automáticamente');

} catch (error) {
  console.error('❌ Error ejecutando migraciones:', error.message);
  console.error('📋 Stack trace:', error.stack);

  if (error.stdout) console.log('📤 stdout:', error.stdout);
  if (error.stderr) console.log('📥 stderr:', error.stderr);

  process.exit(1);
}
