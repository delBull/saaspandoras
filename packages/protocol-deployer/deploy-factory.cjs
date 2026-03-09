const ethers = require("ethers");
const json = require("./src/artifacts/PandorasProtocolFactory.json");
require('dotenv').config({ path: '../../.env' }); // Load from root
require('dotenv').config({ path: '../../apps/dashboard/.env' }); // Fallback

async function main() {
    const privateKey = process.env.PANDORA_ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("Private Key not found in environment (.env)");
    const alchemyRpc = "https://ethereum-sepolia-rpc.publicnode.com";
    const eth = ethers;
    const StaticJsonRpcProvider = eth.providers.StaticJsonRpcProvider || eth.JsonRpcProvider;

    console.log(`Testing RPC: ${alchemyRpc}`);
    const provider = new StaticJsonRpcProvider(alchemyRpc, 11155111);
    const wallet = new eth.Wallet(privateKey, provider);
    console.log(`📡 Connected to network with wallet: ${wallet.address}`);

    const FactoryDeployer = new eth.ContractFactory(json.abi, json.bytecode, wallet);

    console.log("🏭 Deploying PandorasProtocolFactory...");
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
