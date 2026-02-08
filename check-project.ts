
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./apps/dashboard/src/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: "./apps/dashboard/.env" });

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) throw new Error("POSTGRES_URL not found");

const client = postgres(connectionString);
const db = drizzle(client, { schema });
const projects = schema.projects;

async function main() {
    console.log("Checking project status for 'mezcal-bull'...");
    const project = await db.query.projects.findFirst({
        where: eq(projects.slug, 'mezcal-bull'),
    });

    if (!project) {
        console.log("❌ Project 'mezcal-bull' not found!");
    } else {
        console.log("✅ Project found:");
        console.log(`- ID: ${project.id}`);
        console.log(`- Status: ${project.status}`);
        console.log(`- Deployment Status: ${project.deploymentStatus}`);
        console.log(`- Applicant Wallet: ${project.applicantWalletAddress}`);
        console.log(`- Treasury Address: ${project.treasuryAddress}`);
    }
}

main().catch(console.error).finally(() => process.exit());
