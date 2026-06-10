import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

async function migrateDB(name: string, connectionString: string | undefined) {
    if (!connectionString) {
        console.log(`Skipping ${name} - No connection string found.`);
        return;
    }
    
    console.log(`\n--- Migrating ${name} ---`);
    const pool = new Pool({ connectionString });
    
    try {
        // 1. Previous Missing Migrations (just in case they weren't run on Main)
        console.log('Ensuring previous missing columns...');
        await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS extra_config jsonb DEFAULT '{}'::jsonb NOT NULL`);
        await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS allowance_controller_address varchar(255)`);

        // Create types and tables from 0006 if missing
        try { await pool.query(`CREATE TYPE "public"."event_registration_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'ATTENDED')`); } catch(e){}
        try { await pool.query(`CREATE TYPE "public"."project_event_type" AS ENUM('MACRO', 'CALENDAR')`); } catch(e){}
        
        // Let's modify project_event_type enum to include CALENDAR if it doesn't have it
        try {
            await pool.query(`ALTER TYPE "public"."project_event_type" ADD VALUE IF NOT EXISTS 'CALENDAR'`);
            console.log('✅ Added CALENDAR to project_event_type');
        } catch(e) {}

        // Create missing tables if needed
        const sql = fs.readFileSync(path.join(process.cwd(), 'drizzle/0006_modern_war_machine.sql'), 'utf-8');
        const statements = sql.split('--> statement-breakpoint').filter(s => s.trim().length > 0);
        for (const statement of statements) {
            try { await pool.query(statement); } catch(e) {}
        }

        // 2. New Sovereign Calendar columns
        console.log('Adding Sovereign Calendar columns...');
        await pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS selected_date_time timestamp with time zone`);
        
        console.log(`✅ ${name} Migration Complete!`);
    } catch (e: any) {
        console.error(`❌ Error migrating ${name}:`, e.message);
    } finally {
        await pool.end();
    }
}

async function runAll() {
    await migrateDB('LOCAL', process.env.DATABASE_URL);
    await migrateDB('STAGING', process.env.DATABASE_URL_STAGING);
    await migrateDB('MAIN', process.env.DATABASE_URL_MAIN);
}

runAll();
