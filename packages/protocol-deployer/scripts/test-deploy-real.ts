
import { deployW2EProtocol } from "../src/deploy";
import type { W2EConfig } from "../src/types";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

async function main() {
    console.log("🧪 Testing Real Deployment Logic...");

    const mockConfig: W2EConfig = {
        protocolName: "Test Protocol",
        protocolCategory: "Test",
        licenseToken: {
            name: "Test License",
            symbol: "TESTL",
            price: "0.001",
        },
        utilityToken: {
            name: "Test Utility",
            symbol: "TESTU",
            initialSupply: 1000000,
            feePercentage: 50
        },
        quorumPercentage: 10,
        votingDelaySeconds: 100,
        votingPeriodHours: 24,
        executionDelayHours: 1,
        emergencyPeriodHours: 24,
        emergencyQuorumPct: 20,
        platformFeePercentage: 0.01,
        stakingRewardRate: "1000000000",
        phiFundSplitPct: 20,
        maxLicenses: 100,
        treasurySigners: [],
        creatorWallet: "0x5aeaE3D13F480a4231dD09D873f5A094424A2ed6", // User wallet
        creatorPayoutPct: 80,
        targetAmount: "1000000000000000000",
        payoutWindowSeconds: 3600,
        inactivityThresholdSeconds: 86400,
        targetNetwork: "sepolia"
    };

    try {
        const result = await deployW2EProtocol(`test-protocol-${Date.now()}`, mockConfig, "sepolia");
        console.log("✅ Deployment Successful:", result);
    } catch (error) {
        console.error("❌ Deployment Failed:", (error as Error).message || error);
    }
}

main();
