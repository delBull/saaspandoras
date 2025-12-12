
import { deployW2EProtocol } from "../src/deploy";
import type { W2EConfig } from "../src/types";

async function main() {
    console.log("🧪 Testing Real Deployment Logic...");

    const mockConfig: W2EConfig = {
        protocolName: "Test Protocol",
        protocolCategory: "Test",
        licenseToken: {
            name: "Test License",
            symbol: "TESTL",
            maxLicenses: 100,
            price: "0.001",
        },
        utilityToken: {
            name: "Test Utility",
            symbol: "TESTU",
            initialSupply: 1000000,
            feePercentage: 50
        },
        quorumPercentage: 10,
        votingDelaySeconds: 0,
        votingPeriodHours: 1,
        executionDelayHours: 0,
        emergencyPeriodHours: 24,
        emergencyQuorumPct: 20,
        platformFeePercentage: 0.01,
        stakingRewardRate: "1000000000",
        phiFundSplitPct: 20,
        maxLicenses: 100,
        treasurySigners: [],
        creatorWallet: "0xDEEb671dEda720a75B07E9874e4371c194e38919", // User wallet
        creatorPayoutPct: 80,
        targetAmount: "1000000000000000000",
        payoutWindowSeconds: 3600,
        inactivityThresholdSeconds: 86400,
        targetNetwork: "sepolia"
    };

    try {
        const result = await deployW2EProtocol("test-protocol-v1", mockConfig, "sepolia");
        console.log("✅ Deployment Successful:", result);
    } catch (error) {
        console.error("❌ Deployment Failed:", error);
    }
}

main();
