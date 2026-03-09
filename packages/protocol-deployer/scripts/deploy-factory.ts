import * as ethers from "ethers";
import * as dotenv from "dotenv";
import PandorasProtocolFactoryArtifact from "../src/artifacts/PandorasProtocolFactory.json";

// Load environment variables
const envPaths = [
    "../../.env",
    "../../apps/dashboard/.env.local",
    "../../apps/dashboard/.env"
];

const fs = require('fs');
const path = require('path');
envPaths.forEach(p => {
    const fullPath = path.resolve(process.cwd(), p);
    if (fs.existsSync(fullPath)) dotenv.config({ path: fullPath });
});

async function main() {
    const privateKey = process.env.PANDORA_ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("Private Key not found in environment (PANDORA_ORACLE_PRIVATE_KEY)");

    // Forced Alchemy endpoint for Sepolia
    const alchemyRpc = "https://eth-sepolia.g.alchemy.com/v2/demo";
    const eth = ethers as any;
    const StaticJsonRpcProvider = eth.providers.StaticJsonRpcProvider || eth.JsonRpcProvider;

    console.log(`Testing RPC: ${alchemyRpc}`);
    const provider = new StaticJsonRpcProvider(alchemyRpc, 11155111);

    const wallet = new eth.Wallet(privateKey, provider);
    console.log(`📡 Connected to network with wallet: ${wallet.address}`);

    console.log("🏭 Deploying PandorasProtocolFactory...");

    const FactoryDeployer = new eth.ContractFactory(
        PandorasProtocolFactoryArtifact.abi,
        PandorasProtocolFactoryArtifact.bytecode,
        wallet
    );

    const factoryContract = await FactoryDeployer.deploy();

    if (factoryContract.waitForDeployment) {
        await factoryContract.waitForDeployment();
    } else {
        await factoryContract.deployed();
    }

    console.log(`\n=============================================`);
    console.log(`✅ PandorasProtocolFactory deployed successfully!`);
    console.log(`📌 Factory Address: ${factoryContract.address || factoryContract.target}`);
    console.log(`=============================================\n`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
