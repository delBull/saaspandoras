
import { db } from "../db";
import { projects } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { harmonizeProject } from "../lib/projects/harmonizer";

async function verify() {
    console.log("🧪 Testing Harmonization for 'narai'...");
    
    const project = await db.query.projects.findFirst({
        where: and(eq(projects.slug, "narai"), eq(projects.isDeleted, false))
    });

    if (!project) {
        console.error("❌ 'narai' project not found in DB.");
        process.exit(1);
    }

    console.log("Original Data (Critical Fields):", {
        id: project.id,
        chainId: project.chainId,
        licenseContractAddress: project.licenseContractAddress,
        treasuryAddress: project.treasuryAddress,
        artifacts: Array.isArray(project.artifacts) ? `${project.artifacts.length} items` : "not array"
    });

    const harmonized = harmonizeProject(project);

    console.log("\nHarmonized Data (Unified Fields):", {
        chainId: harmonized.chainId,
        chain_id: harmonized.chain_id,
        licenseContractAddress: harmonized.licenseContractAddress,
        license_contract_address: harmonized.license_contract_address,
        treasuryAddress: harmonized.treasuryAddress,
        treasury_address: harmonized.treasury_address,
        governorContractAddress: harmonized.governorContractAddress,
        networkName: harmonized.networkName,
        protocolVersion: harmonized.protocolVersion
    });

    if (harmonized.licenseContractAddress && harmonized.licenseContractAddress.startsWith('0x')) {
        console.log("\n✅ SUCCESS: License address resolved.");
    } else if (harmonized.artifacts.length > 0) {
        console.log("\n⚠️ WARNING: License address NOT resolved despite having artifacts. Check type names.");
    } else {
        console.log("\nℹ️ INFO: No artifacts or manual addresses found for Narai. Expected if deployer didn't save yet.");
    }
}

verify().catch(console.error);
