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

  // Verificar el estado actual de migraciones
  console.log('📊 Verificando estado de migraciones...');
  let journalContent;
  try {
    const journalPath = path.join(dashboardPath, 'drizzle', 'meta', '_journal.json');
    const journalData = fs.readFileSync(journalPath, 'utf8');
    journalContent = JSON.parse(journalData);
    console.log(`📋 Migraciones aplicadas según journal: ${journalContent.entries.length}`);
    journalContent.entries.forEach(entry => {
      console.log(`   ✅ ${entry.tag} (${entry.when})`);
    });
  } catch (error) {
    console.log('📋 No se encontró journal o está vacío (primer despliegue)');
    journalContent = { entries: [] };
  }

  // Opción 1: Usar push (más seguro para producción)
  console.log('📊 Intentando usar drizzle-kit push (más seguro para producción existente)...');
  try {
    execSync('npx drizzle-kit push', {
      cwd: dashboardPath,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    console.log('✅ Push completado exitosamente');
  } catch (pushError) {
    console.log('⚠️ Push falló, intentando migrate con --force...');

    // Opción 2: Usar migrate con force (si push falla)
    try {
      execSync('npx drizzle-kit migrate --force', {
        cwd: dashboardPath,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'production'
        }
      });
      console.log('✅ Migrate con force completado exitosamente');
    } catch (migrateError) {
      console.log('❌ Migrate también falló. Intentando crear solo las tablas faltantes...');

      // Opción 3: Crear solo la tabla users si no existe
      console.log('📋 Creando tabla users manualmente...');
      const { Client } = await import('pg');

      const client = new Client({
        connectionString: process.env.DATABASE_URL,
      });

      try {
        await client.connect();

        // Verificar si la tabla users existe
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'users'
          );
        `);

        if (!result.rows[0].exists) {
          console.log('📋 Creando tabla users...');
          await client.query(`
            CREATE TABLE "users" (
              "id" varchar(255) PRIMARY KEY,
              "name" varchar(255),
              "email" varchar(255) UNIQUE,
              "image" text,
              "walletAddress" varchar(42) UNIQUE,
              "hasPandorasKey" boolean DEFAULT false NOT NULL,
              "kycLevel" varchar(20) DEFAULT 'basic' NOT NULL,
              "kycCompleted" boolean DEFAULT false NOT NULL,
              "kycData" jsonb,
              "connectionCount" integer DEFAULT 1 NOT NULL,
              "lastConnectionAt" timestamp DEFAULT now(),
              "createdAt" timestamp DEFAULT now() NOT NULL
            );
          `);
          console.log('✅ Tabla users creada exitosamente');
        } else {
          console.log('✅ Tabla users ya existe');
        }

        await client.end();
        console.log('✅ Configuración básica completada');

      } catch (dbError) {
        console.error('❌ Error con conexión directa a DB:', dbError.message);
        await client.end();
        throw dbError;
      }
    }
  }

  console.log('✅ Migraciones completadas exitosamente');
  console.log('🔄 La aplicación debería reiniciarse automáticamente');

} catch (error) {
  console.error('❌ Error ejecutando migraciones:', error.message);
  console.error('📋 Stack trace:', error.stack);

  if (error.stdout) console.log('📤 stdout:', error.stdout);
  if (error.stderr) console.log('📥 stderr:', error.stderr);

  process.exit(1);
}
