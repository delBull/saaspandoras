import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Client } from 'pg';

export function GET() {
  return NextResponse.json({
    message: 'Use POST method to create users table',
    methods: ['POST']
  });
}

export async function POST(_request: NextRequest) {
  try {
    console.log('🔌 Intentando crear tabla users...');

    // Verificar que la DATABASE_URL esté disponible
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL no configurada' },
        { status: 500 }
      );
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    try {
      // Verificar si la tabla users ya existe
      console.log('🔍 Verificando si la tabla users existe...');

      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'users'
        );
      `);

      if (result.rows[0]?.exists) {
        console.log('✅ La tabla users ya existe');
        return NextResponse.json({
          success: true,
          message: 'La tabla users ya existe',
          action: 'none'
        });
      }

      console.log('📋 La tabla users no existe, creando...');

      // Crear la tabla users
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

      // Crear índices
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_wallet_address
        ON "users" (LOWER("walletAddress"));
      `);

      console.log('✅ Tabla users creada exitosamente');

      return NextResponse.json({
        success: true,
        message: 'Tabla users creada exitosamente',
        action: 'created'
      });

    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('Error creando tabla users:', error);
    return NextResponse.json(
      {
        error: 'Error creando tabla users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
