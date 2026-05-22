const { createThirdwebClient, getContract, readContract } = require("thirdweb");
const { defineChain } = require("thirdweb/chains");

const client = createThirdwebClient({
  clientId: "c8e595687d8cb3034821b18ed8268cbe"
});

const contract = getContract({
  client,
  chain: defineChain(11155111), // Sepolia
  address: "0xCd3C06cf0cbF5B587361C4FE486e70978B685A47"
});

async function main() {
  console.log("=== Inspecting Sepolia License Contract ===");
  try {
    const supply = await readContract({
      contract,
      method: "function totalSupply() view returns (uint256)",
      params: []
    });
    console.log("totalSupply():", supply.toString());
  } catch (e) {
    console.log("Failed to query totalSupply():", e.message);
  }

  for (let i = 0; i < 5; i++) {
    try {
      const price = await readContract({
        contract,
        method: "function getPhasePrice(uint256) view returns (uint256)",
        params: [BigInt(i)]
      });
      console.log(`getPhasePrice(${i}):`, price.toString(), `(${Number(price) / 1e18} ETH)`);
    } catch (e) {
      console.log(`getPhasePrice(${i}) failed:`, e.message);
    }
  }

  try {
    const price = await readContract({
      contract,
      method: "function licensePrice() view returns (uint256)",
      params: []
    });
    console.log("licensePrice():", price.toString());
  } catch (e) {
    console.log("Failed to query licensePrice():", e.message);
  }
}

main().catch(console.error);
