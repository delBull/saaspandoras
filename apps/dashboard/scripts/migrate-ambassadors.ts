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
        // Enums from 0004 & 0005
        try { await pool.query(`CREATE TYPE "public"."ambassador_status" AS ENUM('pending', 'active', 'suspended', 'revoked')`); } catch(e){}
        try { await pool.query(`CREATE TYPE "public"."commission_status" AS ENUM('pending', 'paid', 'cancelled')`); } catch(e){}
        
        const files = ['0004_grey_jocasta.sql', '0005_lively_lucky_pierre.sql'];
        
        for (const file of files) {
            console.log(`Running ${file}...`);
            const sqlStr = fs.readFileSync(path.join(process.cwd(), 'drizzle', file), 'utf-8');
            const statements = sqlStr.split('--> statement-breakpoint').filter(s => s.trim().length > 0);
            
            for (const statement of statements) {
                try { 
                    await pool.query(statement); 
                } catch(e: any) {
                    if (!e.message.includes('already exists')) {
                        console.error(`Error in statement:`, e.message);
                    }
                }
            }
        }
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
