
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
            tagline: "Governance",
            status: "live",
            chainId: 8453, // Base
            businessCategory: "infrastructure",
        }).returning();

        if (inserted) {
            console.log("Created Project ID:", inserted.id);
        } else {
            console.error("Failed to create project.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}

main();
