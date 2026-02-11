
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Ensuring Pandoras project exists...");
    try {
        const existing = await db.query.projects.findFirst({
            where: eq(projects.slug, "pandoras")
        });

        if (existing) {
            console.log("Project already exists:", existing.id);
            return;
        }

        console.log("Creating Pandoras project...");
        // Create new project
        const [inserted] = await db.insert(projects).values({
            title: "Pandora's DAO",
            slug: "pandoras",
            description: "The official governance DAO for Pandora's Protocol.",
            short_description: "Governance",
            status: "published",
            chain_id: 8453, // Base
            category: "infrastructure", // or similar
            // Add other required fields with defaults
        }).returning();

        console.log("Created Project ID:", inserted.id);
    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}

main();
