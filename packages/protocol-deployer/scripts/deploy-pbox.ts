import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables aggressively across the workspace
const paths = [
    path.join(__dirname, "../.env"),
    path.join(__dirname, "../../.env"),
    path.join(__dirname, "../../../.env"),
    path.join(__dirname, "../../../apps/dashboard/.env"),
];

paths.forEach(p => {
    if (fs.existsSync(p)) dotenv.config({ path: p });
});

const CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
const NETWORK = process.env.NETWORK || 'sepolia';

// Base Mainnet is required here
let chainId = 8453;
let defaultRpc = "https://mainnet.base.org";

const RPC_URL = CLIENT_ID
    ? `https://${chainId}.rpc.thirdweb.com/${CLIENT_ID}`
    : (process.env.BASE_RPC_URL || defaultRpc);

console.log(`📡 Using RPC: ${RPC_URL}`);

const PRIVATE_KEY = process.env.PANDORA_ORACLE_PRIVATE_KEY || process.env.PROTOCOL_ADMIN_PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error("❌ PANDORA_ORACLE_PRIVATE_KEY not set in .env (Checked local, root, and dashboard)");
    process.exit(1);
} else {
    console.log(`🔑 Private Key found (ending in ...${PRIVATE_KEY.slice(-4)})`);
}

// Path to artifact 
const HARDHAT_ARTIFACT_PATH = path.join(__dirname, "../artifacts/contracts/core/PBOXToken.sol/PBOXToken.json");

async function main() {
    console.log("🚀 Deploying PBOXToken to Base Mainnet...");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    console.log(`👤 Deployer Wallet: ${wallet.address}`);

    // Ethers v6 syntax natively supported in Hardhat environment here because package.json might have ^6 or ^5.
    // The previous script used v6 formatEther, let's keep it safe.
    let balance;
    try {
        balance = await provider.getBalance(wallet.address);
        // Ethers v5 fallback natively directly
        console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`);
    } catch (e) {
        console.log(`💰 Balance Check Failed`);
    }

    if (!fs.existsSync(HARDHAT_ARTIFACT_PATH)) {
        throw new Error("❌ Artifact not found. Run `npx hardhat compile` first.");
    }

    const { abi, bytecode } = JSON.parse(fs.readFileSync(HARDHAT_ARTIFACT_PATH, "utf8"));
    const Factory = new ethers.ContractFactory(abi, bytecode, wallet);

    // PBOX Constructor arguments: _factory, _rootTreasury, admin
    // We set the deployer as factory (Minter) and admin for now.
    const factoryAddress = wallet.address;
    const rootTreasury = process.env.ROOT_TREASURY_ADDRESS || wallet.address;
    const admin = wallet.address;

    console.log(`📦 Deploying with Factory: ${factoryAddress}, Treasury: ${rootTreasury}, Admin: ${admin}`);

    const contract = await Factory.deploy(factoryAddress, rootTreasury, admin);

    // Support ethers v5 and v6 wait methods
    if (contract.waitForDeployment) {
        await contract.waitForDeployment(); // v6
    } else {
        await contract.deployed(); // v5
    }

    const address = contract.address || await contract.getAddress();

    console.log(`✅ PBOXToken successfully deployed at: ${address}`);

    console.log("\n⚠️ IMPORTANT: Update your .env or Config with this address!");
    console.log(`NEXT_PUBLIC_PBOX_TOKEN_ADDRESS=${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
