import postgres from 'postgres';

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL is not set');
    }

    // Create a direct connection with SSL required for Neon
    const sql = postgres(connectionString, { ssl: 'require' });

    console.log('Running custom migration for audit_logs.id...');

    try {
        // 1. Add a temporary UUID column
        await sql`ALTER TABLE audit_logs ADD COLUMN new_id uuid DEFAULT gen_random_uuid();`;
        console.log('Added new_id column.');

        // 2. Drop the old id column (which is likely a serial/integer)
        await sql`ALTER TABLE audit_logs DROP COLUMN id CASCADE;`;
        console.log('Dropped old id column.');

        // 3. Rename the new column to 'id'
        await sql`ALTER TABLE audit_logs RENAME COLUMN new_id TO id;`;
        console.log('Renamed new_id to id.');

        // 4. Add the primary key constraint back
        await sql`ALTER TABLE audit_logs ADD PRIMARY KEY (id);`;
        console.log('Added primary key constraint.');

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

main();
