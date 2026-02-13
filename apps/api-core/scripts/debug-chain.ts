
import { createThirdwebClient, getContract, readContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;

console.log("----------------------------------------");
console.log("🔍 Debugging Chain Connection (Sepolia)");
console.log("----------------------------------------");

const client = createThirdwebClient({
    secretKey: SECRET_KEY,
});

// The confirmed Sepolia Address
const CONTRACT_ADDRESS = "0x720f378209a5c68f8657080a28ea6452518f67b0";

async function main() {
    try {
        console.log(`\n📡 Checking Contract: ${CONTRACT_ADDRESS}`);
        console.log(`🌍 Chain: Sepolia (${sepolia.id})`);

        // User's wallet from logs
        const testAddress = "0x121A897F0f5a9B7c44756F40bDB2c8e87D2834fA";
        console.log(`   Target: ${testAddress}`);

        const balance = await readContract({
            contract: getContract({ client, chain: sepolia, address: CONTRACT_ADDRESS }),
            method: "function balanceOf(address) view returns (uint256)",
            params: [testAddress]
        });
        console.log(`✅ Balance: ${balance.toString()}`);

        console.log("\n4️⃣  Testing Custom Gate Function (isGateHolder)...");
        try {
            const isGateHolder = await readContract({
                contract: getContract({ client, chain: sepolia, address: CONTRACT_ADDRESS }),
                method: "function isGateHolder(address) view returns (bool)",
                params: [testAddress]
            });
            console.log(`✅ isGateHolder: ${isGateHolder}`);
        } catch (e) {
            console.log("❌ isGateHolder FAILED / NOT IMPLEMENTED");
            console.log(e);
        }

    } catch (error) {
        console.error("\n❌ FATAL ERROR During Debug:");
        console.error(error);
    }
}

main();
