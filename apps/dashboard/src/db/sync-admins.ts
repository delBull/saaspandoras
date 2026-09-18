import { db } from "./index";
import { administrators } from "./schema";
import { sql } from "drizzle-orm";

async function syncAdmins() {
    console.log("🚀 Starting Admin Sync...");

    const adminsToSync = [
        { walletAddress: (process.env.SUPER_ADMIN_WALLET || "0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9").toLowerCase(), name: "Deployer Admin" },
        { walletAddress: (process.env.MARCO_ADMIN_WALLET || "0x96631d6c5295f1f08334888c5d6f3a246fa9c3ba").toLowerCase(), name: "Marco Admin" }
    ];

    try {
        for (const admin of adminsToSync) {
            console.log(`Syncing ${admin.name} (${admin.walletAddress})...`);

            await db.insert(administrators)
                .values({
                    walletAddress: admin.walletAddress.toLowerCase(),
                    role: "admin",
                    // status does not exist in schema, role is enough or alias
                    addedBy: "system_sync"
                })
                .onConflictDoUpdate({
                    target: administrators.walletAddress,
                    set: {
                        role: "admin",
                    }
                });
        }
        console.log("✅ Admin Sync Completed Successfully!");
    } catch (error) {
        console.error("💥 Admin Sync FAILED:", error);
    } finally {
        process.exit(0);
    }
}

syncAdmins();
