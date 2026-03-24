
import { db } from "./src/db";
import { paymentLinks } from "./src/db/schema";
import { desc, eq } from "drizzle-orm";

async function main() {
    console.log("Checking recent payment links...");
    const recentLinks = await db.select().from(paymentLinks).orderBy(desc(paymentLinks.createdAt)).limit(1);

    if (recentLinks.length === 0) {
        console.log("No links found.");
        return;
    }

    const link = recentLinks[0];
    if (!link) {
        console.log("No recent link found.");
        return;
    }
    console.log(`Found recent link ID: ${link.id}, Methods: ${JSON.stringify(link.methods)}`);

    const currentMethods = link.methods as string[] || [];
    if (!currentMethods.includes("wire")) {
        console.log("Adding 'wire' to methods...");
        const newMethods = [...currentMethods, "wire"];

        await db.update(paymentLinks)
            .set({ methods: newMethods })
            .where(eq(paymentLinks.id, link.id));

        console.log("Updated link methods:", newMethods);
    } else {
        console.log("Link already has 'wire' enabled.");
    }
}

main().catch(console.error).then(() => process.exit(0));
