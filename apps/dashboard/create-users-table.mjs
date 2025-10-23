#!/usr/bin/env node

/**
 * Script simplificado para crear solo la tabla users en producción
 * Esta es la opción más segura si las otras tablas ya existen
 */

import { Client } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Creando tabla users en producción...');
console.log(`📁 Directorio de trabajo: ${__dirname}`);

async function createUsersTable() {
  // Verificar que tenemos DATABASE_URL
  let databaseUrl = process.env.DATABASE_URL;

  // Si no hay DATABASE_URL, intentar cargar desde .env.local (para desarrollo)
  if (!databaseUrl) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const dotenv = await import('dotenv');

      const envLocalPath = path.join(__dirname, '.env.local');
      const envPath = path.join(__dirname, '.env');

      if (fs.existsSync(envLocalPath)) {
        dotenv.config({ path: envLocalPath });
        databaseUrl = process.env.DATABASE_URL;
        console.log('📋 Cargando configuración desde .env.local');
      } else if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        databaseUrl = process.env.DATABASE_URL;
        console.log('📋 Cargando configuración desde .env');
      }
    } catch (error) {
      console.log('📋 dotenv no disponible, continuando...');
    }
  }

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL no está configurada');
    console.log('📋 Configura la variable de entorno DATABASE_URL o crea un archivo .env.local');
    console.log('📋 Para producción, configura las variables de entorno en Vercel');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Conectando a la base de datos...');
    await client.connect();

    // Verificar si la tabla users ya existe
    console.log('🔍 Verificando si la tabla users existe...');
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (result.rows[0].exists) {
      console.log('✅ La tabla users ya existe');
      console.log('📋 No es necesario crear la tabla');

      // Verificar la estructura de la tabla
      console.log('📊 Verificando estructura de la tabla users...');
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        ORDER BY ordinal_position;
      `);

      console.log('📋 Estructura actual de la tabla users:');
      structure.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });

    } else {
      console.log('📋 La tabla users no existe, creando...');

      // Crear la tabla users con la estructura correcta
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

      // Crear índices adicionales si es necesario
      console.log('📋 Creando índices...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_wallet_address
        ON "users" (LOWER("walletAddress"));
      `);

      console.log('✅ Índices creados exitosamente');
    }

    // Verificar que la tabla funciona
    console.log('🧪 Verificando que la tabla funciona...');
    const testResult = await client.query('SELECT COUNT(*) as count FROM "users"');
    console.log(`📊 La tabla users tiene ${testResult.rows[0].count} registros`);

    await client.end();
    console.log('✅ Configuración completada exitosamente');
    console.log('🎉 La aplicación debería funcionar ahora');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📋 Stack trace:', error.stack);
    await client.end();
    process.exit(1);
  }
}

createUsersTable();
