#!/usr/bin/env node

/**
 * Script completo para sincronizar producción con local
 * 1. Exporta la estructura local
 * 2. Hace push del código
 * 3. Sincroniza la base de datos en producción
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando sincronización completa: Local → Producción...');

async function fullSync() {
  try {
    console.log('📋 Paso 1: Exportando estructura local...');
    execSync('npm run db:export-local', {
      cwd: __dirname,
      stdio: 'inherit'
    });

    console.log('\n📋 Paso 2: Verificando que el export se creó...');
    const fs = await import('fs');
    const exportPath = path.join(__dirname, 'local-schema-export.json');

    if (!fs.existsSync(exportPath)) {
      throw new Error('No se pudo crear el archivo de exportación');
    }

    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    console.log(`✅ Exportación completada: ${exportData.tables.length} tablas`);
    console.log(`📊 Tamaño del archivo: ${fs.statSync(exportPath).size} bytes`);

    console.log('\n📋 Paso 3: Preparando código para deployment...');
    console.log('💡 Asegúrate de hacer commit y push de los cambios:');
    console.log('   git add .');
    console.log('   git commit -m "fix: database sync and schema consistency"');
    console.log('   git push origin main');
    console.log('');
    console.log('📋 Después del deployment, ejecuta:');
    console.log('   npm run db:sync-production');
    console.log('');
    console.log('🎯 Opciones para producción:');
    console.log('   1. Ve a https://staging.dash.pandoras.finance');
    console.log('   2. Abre DevTools (F12) → Console');
    console.log('   3. Ejecuta: fetch("/api/admin/create-users-table", {method: "POST"}).then(r=>r.json()).then(console.log)');

  } catch (error) {
    console.error('❌ Error en sincronización:', error.message);
    console.error('📋 Stack trace:', error.stack);
    process.exit(1);
  }
}

fullSync();
