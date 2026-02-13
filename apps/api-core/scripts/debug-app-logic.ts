
import { client } from "../src/lib/thirdweb-client.js";
import { config } from "../src/config.js";
import { getContract, readContract } from "thirdweb";
import { PANDORAS_KEY_ABI } from "../src/lib/pandoras-key-abi.js";
import dotenv from "dotenv";

dotenv.config();

console.log("----------------------------------------");
console.log("🔍 Debugging Application Logic (Internal)");
console.log("----------------------------------------"); // Fix missing closing parenthesis

async function main() {
    try {
        console.log(`🔗 Configured Chain: ${config.chain.id}`);
        console.log(`📝 Configured Address: ${config.nftContractAddress}`);

        const testAddress = "0x121A897F0f5a9B7c44756F40bDB2c8e87D2834fA";
        console.log(`👤 Testing User: ${testAddress}`);

        const contract = getContract({
            client,
            chain: config.chain,
            address: config.nftContractAddress,
            abi: PANDORAS_KEY_ABI
        });

        console.log("1️⃣  Testing isGateHolder...");
        const hasAccess = await readContract({
            contract,
            method: "isGateHolder",
            params: [testAddress]
        });
        console.log(`✅ Result: ${hasAccess}`);

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

main();
