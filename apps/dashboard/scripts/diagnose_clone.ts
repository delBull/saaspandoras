import { db } from "../src/db";
import { projects } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
    try {
        const slug = "escuela-libre-digital";
        const sourceProject = await db.query.projects.findFirst({
            where: (projects, { eq }) => eq(projects.slug, slug)
        });

        if (!sourceProject) {
            console.log("Source project not found");
            return;
        }

        const {
            id,
            createdAt,
            updatedAt,
            slug: oldSlug,
            status,
            deploymentStatus,
            contractAddress,
            treasuryAddress,
            licenseContractAddress,
            utilityContractAddress,
            loomContractAddress,
            governorContractAddress,
            registryContractAddress,
            artifacts,
            raisedAmount,
            returnsPaid,
            votingContractAddress,
            ...cloneData
        } = sourceProject;

        const newSlug = `${oldSlug}-clone-${Date.now().toString().slice(-4)}`;
        console.log("old Title:", sourceProject.title);
        const newTitle = `${sourceProject.title} (Clone)`;

        console.log("Attempting to insert clone...");

        const [newProject] = await db.insert(projects).values({
            ...cloneData,
            title: newTitle,
            slug: newSlug,
            status: 'draft',
            deploymentStatus: 'pending',
            raisedAmount: '0.00',
            returnsPaid: '0.00',
            artifacts: [],
        }).returning();

        console.log("Success! Cloned project ID:", newProject.id);
    } catch (e: any) {
        console.error("Error inserting clone:", e.message);
    }
}

run().catch(console.error);
