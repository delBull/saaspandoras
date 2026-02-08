
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./apps/dashboard/src/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: "./apps/dashboard/.env" });

dotenv.config({ path: "./apps/dashboard/.env.local" });

const connectionString = process.env.DATABASE_URL_STAGING;
if (!connectionString) throw new Error("DATABASE_URL_STAGING not found");

const client = postgres(connectionString);
const db = drizzle(client, { schema });
// Explicitly define schema mapping if needed or just use the imported object
const projects = schema.projects;
const administrators = schema.administrators;

async function main() {
    console.log("Fixing project status for 'mezcal-bull'...");

    // 1. Check current status
    const project = await db.query.projects.findFirst({
        where: eq(projects.slug, 'mezcal-bull'),
    });

    if (!project) {
        console.log("❌ Project 'mezcal-bull' not found!");
        return;
    }

    console.log(`Current Status: ${project.status}`);
    console.log(`Current Deployment Status: ${project.deploymentStatus}`);

    // 2. Update to 'live' if deployed
    if (project.deploymentStatus === 'deployed' && project.status !== 'live') {
        console.log("⚡ Updating status to 'live'...");
        await db.update(projects)
            .set({ status: 'live' })
            .where(eq(projects.slug, 'mezcal-bull'));
        console.log("✅ Project status updated to 'live'. Check the dashboard now.");
    } else {
        console.log("ℹ️ No update needed (already live or not deployed).");
    }
}

main().catch(console.error).finally(() => process.exit());
