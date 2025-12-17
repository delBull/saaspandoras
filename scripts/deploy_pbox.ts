import { createThirdwebClient } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { deployPublishedContract } from "thirdweb/deploys";
import { defineChain } from "thirdweb/chains";
import dotenv from "dotenv";

import path from "path";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
    const secretKey = process.env.THIRDWEB_SECRET_KEY;
    const privateKey = process.env.PROTOCOL_ADMIN_PRIVATE_KEY;

    if (!secretKey || !privateKey) {
        console.error("Error: Missing Environment Variables");
        console.error(`- THIRDWEB_SECRET_KEY: ${secretKey ? "OK" : "MISSING"}`);
        console.error(`- PROTOCOL_ADMIN_PRIVATE_KEY: ${privateKey ? "OK" : "MISSING"}`);
        console.error("\nPlease define these in .env.local to run the deployment.");
        process.exit(1);
    }

    const client = createThirdwebClient({ secretKey });
    const account = privateKeyToAccount({ client, privateKey });

    // Chain: Base (8453) or Sepolia (11155111) depending on ENV
    // For safety in this environment, defaulting to Sepolia unless PROD explicitly set?
    // User asked for "Real" logic. 
    // Let's check NODE_ENV from check.
    const chain = defineChain(process.env.NODE_ENV === 'production' ? 8453 : 11155111);

    console.log(`Deploying PBOX Token to chain ${chain.id}...`);
    console.log(`Deployer: ${account.address}`);

    try {
        // Deploying Standard Thirdweb TokenERC20 (Audited, Secure, Governance-Ready)
        const contractAddress = await deployPublishedContract({
            client,
            chain,
            account,
            contractId: "TokenERC20",
            publisher: "deployer.thirdweb.eth",
            contractParams: {
                defaultAdmin: account.address,
                name: "Pandoras Box Governance",
                symbol: "PBOX",
                primarySaleRecipient: account.address,
            }
        });

        console.log("---------------------------------------------");
        console.log("✅ PBOX Token Deployed Successfully!");
        console.log(`📍 Contract Address: ${contractAddress}`);
        console.log("---------------------------------------------");
        console.log("NEXT STEP: Update your .env files with this address.");
        console.log(`NEXT_PUBLIC_PBOX_TOKEN_ADDRESS=${contractAddress}`);

    } catch (error) {
        console.error("Deployment Failed:", error);
        process.exit(1);
    }
}

main();
