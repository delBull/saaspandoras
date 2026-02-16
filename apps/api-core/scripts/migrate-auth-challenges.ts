import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env');
    console.log('💡 Copy DATABASE_URL from Railway and add it to your .env file');
    process.exit(1);
}

console.log('🔌 Connecting to database...');

const sql = postgres(DATABASE_URL);

async function migrate() {
    try {
        console.log('📝 Creating auth_challenges table...');

        await sql`
            CREATE TABLE IF NOT EXISTS auth_challenges (
                id SERIAL PRIMARY KEY,
                address VARCHAR(42) NOT NULL,
                nonce VARCHAR(255) NOT NULL UNIQUE,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        `;

        console.log('✅ Table created successfully');

        console.log('📝 Creating indexes...');

        await sql`CREATE INDEX IF NOT EXISTS idx_auth_challenges_nonce ON auth_challenges(nonce)`;
        await sql`CREATE UNIQUE INDEX IF NOT EXISTS auth_challenges_address_idx ON auth_challenges(address)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires_at ON auth_challenges(expires_at)`;

        console.log('✅ Indexes created successfully');

        // Verify table exists
        const result = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'auth_challenges'
        `;

        if (result.length > 0) {
            console.log('✅ Verification: auth_challenges table exists');
        } else {
            console.error('❌ Verification failed: table not found');
        }

        console.log('🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await sql.end();
    }
}

migrate().catch(console.error);
