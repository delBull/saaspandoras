
import { db } from "../src/db";
import { projects } from "../src/db/schema";
import { eq, ilike } from "drizzle-orm";

async function main() {
    console.log("Checking for Pandoras project...");
    const project = await db.query.projects.findFirst({
        where: (projects, { or, eq, ilike }) => or(
            eq(projects.slug, "pandoras"),
            eq(projects.slug, "pandoras-dao"),
            ilike(projects.title, "%pandora%")
        )
    });

    if (project) {
        console.log("Found Project:", project.title, "ID:", project.id, "Slug:", project.slug);
        console.log("Address:", project.votingContractAddress);
    } else {
        console.log("No Pandoras project found.");
    }
    process.exit(0);
}

main().catch(console.error);
