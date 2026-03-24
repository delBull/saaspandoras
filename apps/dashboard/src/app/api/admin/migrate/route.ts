import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Client } from 'pg';

/**
 * 🏥 SURGICAL DB MIGRATION - GENESIS v2
 * ============================================================================
 * Agrega las columnas faltantes necesarias para el nuevo sistema de acceso
 * y gamificación sin borrar datos existentes.
 * ============================================================================
 */
export async function POST(_request: NextRequest) {
  try {
    console.log('🔌 Iniciando Migración Quirúrgica...');

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL no configurada' }, { status: 500 });
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
      // 1. Columnas de Identidad y Gamificación (Legacy Sync)
      await client.query(`
        ALTER TABLE "users" 
        ADD COLUMN IF NOT EXISTS "telegram_id" varchar(255) UNIQUE,
        ADD COLUMN IF NOT EXISTS "username" varchar(255),
        ADD COLUMN IF NOT EXISTS "first_name" varchar(255),
        ADD COLUMN IF NOT EXISTS "last_name" varchar(255),
        ADD COLUMN IF NOT EXISTS "is_frozen" boolean DEFAULT false NOT NULL,
        ADD COLUMN IF NOT EXISTS "acquisition_source" varchar(255),
        ADD COLUMN IF NOT EXISTS "referrer_core_user_id" varchar(255),
        ADD COLUMN IF NOT EXISTS "last_harvest_at" timestamp,
        ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL;
      `);

      // 2. Columnas de Gestión de Acceso (Génesis)
      await client.query(`
        ALTER TABLE "users" 
        ADD COLUMN IF NOT EXISTS "access_cohort" varchar(50) DEFAULT 'public',
        ADD COLUMN IF NOT EXISTS "benefits_tier" varchar(50) DEFAULT 'standard',
        ADD COLUMN IF NOT EXISTS "access_granted_at" timestamp,
        ADD COLUMN IF NOT EXISTS "wallet_verified" boolean DEFAULT false NOT NULL;
      `);

      // 3. Crear tabla access_requests si no existe (Unificada)
      await client.query(`
        CREATE TABLE IF NOT EXISTS "access_requests" (
          "id" serial PRIMARY KEY,
          "email" varchar(255) NOT NULL,
          "wallet_address" varchar(100),
          "intent" varchar(100),
          "source" varchar(100) DEFAULT 'landing_v2',
          "status" varchar(50) DEFAULT 'pending',
          "reviewed_at" timestamp,
          "reviewed_by" varchar(42),
          "metadata" jsonb,
          "created_at" timestamp DEFAULT now() NOT NULL
        );
      `);

      console.log('✅ Migración completada exitosamente');

      return NextResponse.json({
        success: true,
        message: 'Surgical migration completed. All Genesis columns added.',
        affectedTable: 'users'
      });

    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('❌ Error en migración:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
