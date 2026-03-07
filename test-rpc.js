const { ethers } = require("ethers");

const urls = [
    // "https://eth-sepolia.g.alchemy.com/v2/demo", // Skipping known bad endpoint
    "https://sepolia.drpc.org",
    "https://rpc.ankr.com/eth_sepolia",
    "https://1rpc.io/sepolia",
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://rpc2.sepolia.org"
];

async function test() {
    console.log("---- Testing Remaining RPCs ----");
    for (const url of urls) {
        console.log("Testing:", url);
        try {
            const tempProvider = new ethers.providers.StaticJsonRpcProvider(url, {
                name: "sepolia",
                chainId: 11155111
            });
            const testAddr = "0x0000000000000000000000000000000000000000";

            const nonce = await Promise.race([
                tempProvider.getTransactionCount(testAddr),
                new Promise((_, reject) => setTimeout(() => reject(new Error("RPC Timeout 4s")), 4000))
            ]);

            console.log("✅ SUCCESS!", url, "Nonce:", nonce);
        } catch (e) {
            console.log("❌ FAILED:", url, e.message);
        }
    }
}
test();
