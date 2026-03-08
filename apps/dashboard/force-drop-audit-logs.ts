import postgres from 'postgres';

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL is not set');
    }

    // Determine if SSL is needed (Neon defaults require it, localhost usually doesn't)
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    const sql = postgres(connectionString, { ssl: isLocal ? false : 'require' });

    console.log('Forcing drop of audit_logs table to bypass drizzle-kit warnings...');

    try {
        await sql`DROP TABLE IF EXISTS audit_logs CASCADE;`;
        console.log('Successfully dropped audit_logs.');
    } catch (error) {
        console.error('Drop failed:', error);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

main();
