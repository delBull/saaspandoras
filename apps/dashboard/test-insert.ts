import { db } from './src/db';
import { ambassadors } from './src/db/schema';
import * as dotenv from 'dotenv';

// Cargar las variables de entorno donde está la DB
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.saaspandoras-secrets.env' }); 

// Forzar a Drizzle a usar la base de datos MAIN si existe la variable
if (process.env.DATABASE_URL_MAIN) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_MAIN;
}

async function main() {
    try {
        console.log('Intentando insertar en la base de datos...');
        const [res] = await db.insert(ambassadors).values({
            fullName: 'Test User',
            email: `test-error-${Date.now()}@gmail.com`,
            referralCode: `TEST-${Date.now()}`,
            walletAddress: '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9',
            origin: 'snarai' as any,
            projectId: 2,
            status: 'pending',
            emailVerified: false,
            verificationToken: '123456'
        }).returning();
        
        console.log('✅ Insert exitoso. El ID es:', res.id);
    } catch (e: any) {
        console.error('❌ El Insert falló. Este es el error real de la Base de Datos:');
        console.error('Mensaje principal:', e.message);
        
        // Extraer los detalles del error subyacente de PostgreSQL (que Vercel nos oculta)
        if (e.cause) {
            console.error('Causa:', e.cause);
        }
        if (e.code) {
            console.error('Código (PG):', e.code);
        }
        if (e.detail) {
            console.error('Detalle:', e.detail);
        }
    }
    process.exit(0);
}

main();
