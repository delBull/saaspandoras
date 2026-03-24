import { NextResponse } from 'next/server';
import { sql } from '@/lib/database';

/**
 * 🚀 UNIFIED GENESIS MIGRATION (RESILIENT)
 * ============================================================================
 * Uses the internal 'sql' instance (postgres-js) which is already 
 * established on Staging/Production for better compatibility.
 * ============================================================================
 */
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🔌 Starting Resilient Migration...');

    // 1. Core Users Table Upgrade
    await sql`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "telegram_id" varchar(255),
      ADD COLUMN IF NOT EXISTS "username" varchar(255),
      ADD COLUMN IF NOT EXISTS "first_name" varchar(255),
      ADD COLUMN IF NOT EXISTS "last_name" varchar(255),
      ADD COLUMN IF NOT EXISTS "is_frozen" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "acquisition_source" varchar(255),
      ADD COLUMN IF NOT EXISTS "referrer_core_user_id" varchar(255),
      ADD COLUMN IF NOT EXISTS "last_harvest_at" timestamp,
      ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now(),
      ADD COLUMN IF NOT EXISTS "access_cohort" varchar(50) DEFAULT 'public',
      ADD COLUMN IF NOT EXISTS "benefits_tier" varchar(50) DEFAULT 'standard',
      ADD COLUMN IF NOT EXISTS "access_granted_at" timestamp,
      ADD COLUMN IF NOT EXISTS "wallet_verified" boolean DEFAULT false;
    `;

    // 2. Access Requests (Unified Waitlist)
    await sql`
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
    `;

    return NextResponse.json({
      success: true,
      message: 'Database upgraded successfully to Genesis v2 specs.',
      affected: ['users', 'access_requests']
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
