import { db } from "../db";
import { users } from "../db/schema";
import { eq, isNull, and } from "drizzle-orm";

/**
 * Script para migrar usuarios existentes al modelo de Identidad Unificada.
 * 
 * Acciones:
 * 1. Asegurar que todos tengan un status ('ACTIVE' por defecto).
 * 2. Asegurar que updatedAt esté poblado.
 * 3. Identificar duplicados potenciales (mismo email pero distinta wallet, etc).
 */
async function migrate() {
    console.log("🚀 Starting Unified Identity Migration...");

    try {
        const allUsers = await db.query.users.findMany();
        console.log(`📊 Found ${allUsers.length} users in database.`);

        let updatedCount = 0;
        const now = new Date();

        for (const user of allUsers) {
            let needsUpdate = false;
            const updates: any = {};

            // 1. Status Check
            if (!user.status) {
                updates.status = 'ACTIVE';
                needsUpdate = true;
            }

            // 2. Timestamps Check
            if (!user.updatedAt) {
                updates.updatedAt = now;
                needsUpdate = true;
            }

            // 3. Normalize Wallets
            if (user.walletAddress && user.walletAddress !== user.walletAddress.toLowerCase()) {
                updates.walletAddress = user.walletAddress.toLowerCase();
                needsUpdate = true;
            }

            if (needsUpdate) {
                await db.update(users)
                    .set(updates)
                    .where(eq(users.id, user.id));
                updatedCount++;
            }
        }

        console.log(`\n✅ Migration Complete!`);
        console.log(`✨ Users updated: ${updatedCount}`);

    } catch (error) {
        console.error("❌ Migration Failed:", error);
    }
}

migrate();
