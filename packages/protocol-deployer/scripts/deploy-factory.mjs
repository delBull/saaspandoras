import * as ethers from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load JSON safely
const artifactPath = path.resolve(__dirname, '../src/artifacts/PandorasProtocolFactory.json');
const PandorasProtocolFactoryArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// Load the .env from the packages/protocol-deployer directory
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    console.log("Loading .env from:", envPath);
    dotenv.config({ path: envPath });
} else {
    console.log("No .env found at", envPath);
}

async function main() {
    let privateKey = process.env.PANDORA_ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("Private Key not found in environment");

    // Format private key if it lacks '0x'
    if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
    }

    const alchemyRpc = "https://eth-sepolia.g.alchemy.com/v2/demo";
    const eth = ethers;
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
