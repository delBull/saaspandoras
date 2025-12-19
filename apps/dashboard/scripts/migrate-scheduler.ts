
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

// Load the SQL
const sqlPath = path.join(process.cwd(), 'scripts', 'scheduler-migration.sql');
const sqlMain = fs.readFileSync(sqlPath, 'utf8');

const sqlPathStaging = path.join(process.cwd(), 'scripts', 'scheduler-migration-staging.sql');
const sqlStaging = fs.readFileSync(sqlPathStaging, 'utf8');

const DBS = {
    local: process.env.DATABASE_URL || "postgresql://Marco@localhost:5432/pandoras_local",
    staging: "postgresql://neondb_owner:npg_uj0h1LpbAQxi@ep-withered-thunder-adt88vka-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
    main: "postgresql://neondb_owner:npg_MjazsA5ybWQ3@ep-summer-bread-adqdsnx4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
};

async function migrate(env: keyof typeof DBS, url: string) {
    console.log(`\n🚀 Migrating [${env}]...`);
    const sqlToRun = env === 'staging' ? sqlStaging : sqlMain;
    const client = new Client({ connectionString: url });
    try {
        await client.connect();
        await client.query(sqlToRun);
        console.log(`✅ [${env}] Success!`);
    } catch (e) {
        console.error(`❌ [${env}] Failed:`, e);
    } finally {
        await client.end();
    }
}

async function main() {
    console.log('📜 Executing Scheduler Migrations...');

    // Verified Local & Main already
    // await migrate('local', DBS.local);
    await migrate('staging', DBS.staging);
    // await migrate('main', DBS.main);
}

main();
