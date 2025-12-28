import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

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
let chainId = 11155111;
let defaultRpc = "https://sepolia.drpc.org";

if (NETWORK === 'base') {
    chainId = 8453;
    defaultRpc = "https://mainnet.base.org";
    console.log("🚀 Targeting BASE MAINNET");
} else {
    console.log("🧪 Targeting SEPOLIA TESTNET");
}

const RPC_URL = CLIENT_ID
    ? `https://${chainId}.rpc.thirdweb.com/${CLIENT_ID}`
    : (process.env.RPC_URL || defaultRpc);

console.log(`Using RPC: ${RPC_URL}`);

const PRIVATE_KEY = process.env.PANDORA_ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;

if (PRIVATE_KEY) {
    console.log(`🔑 Key detected from env (Length: ${PRIVATE_KEY.length})`);
}

if (!PRIVATE_KEY) {
    console.error("❌ PANDORA_ORACLE_PRIVATE_KEY not set in .env (Checked local, root, and dashboard)");
    process.exit(1);
} else {
    console.log(`🔑 Private Key found (ending in ...${PRIVATE_KEY.slice(-4)})`);
}

// Path to artifact (Try Forge path first, then Hardhat)
const FORGE_ARTIFACT_PATH = path.join(__dirname, "../out/PandoraRootTreasury.sol/PandoraRootTreasury.json");
const HARDHAT_ARTIFACT_PATH = path.join(__dirname, "../artifacts/contracts/treasury/PandoraRootTreasury.sol/PandoraRootTreasury.json");

async function main() {
    console.log("🚀 Deploying PandoraRootTreasury to Sepolia...");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    console.log(`📡 Wallet: ${wallet.address}`);
    // Ethers v6: formatEther is on ethers directly
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

    let artifact;
    if (fs.existsSync(FORGE_ARTIFACT_PATH)) {
        console.log("Found Forge artifact.");
        const json = JSON.parse(fs.readFileSync(FORGE_ARTIFACT_PATH, "utf8"));
        artifact = { abi: json.abi, bytecode: json.bytecode.object };
    } else if (fs.existsSync(HARDHAT_ARTIFACT_PATH)) {
        console.log("Found Hardhat artifact.");
        const json = JSON.parse(fs.readFileSync(HARDHAT_ARTIFACT_PATH, "utf8"));
        artifact = { abi: json.abi, bytecode: json.bytecode };
    } else {
        throw new Error("Artifact not found in out/ or artifacts/");
    }

    const Factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    // Constructor args:
    // address[] _signers, uint256 _requiredConfirmations, address _operationalWallet, address _reserveWallet, uint256 _highValueThreshold, uint256 _operationalLimit

    // Logic Fix: Contract forbids duplicate signers. generating random ones for test.
    const signer2 = ethers.Wallet.createRandom();
    const signer3 = ethers.Wallet.createRandom();
    const signers = [wallet.address, signer2.address, signer3.address];

    const confirmations = 2; // Reduced for dev
    const operationalWallet = wallet.address;
    const reserveWallet = wallet.address;
    const highValueThreshold = ethers.parseEther("1.0");
    const operationalLimit = ethers.parseEther("0.1");

    console.log("Deploying with args:", { signers, confirmations, operationalWallet, reserveWallet, highValueThreshold, operationalLimit });

    const contract = await Factory.deploy(
        signers,
        confirmations,
        operationalWallet,
        reserveWallet,
        highValueThreshold,
        operationalLimit
    );

    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log(`✅ PandoraRootTreasury deployed at: ${address}`);

    // Log for user
    console.log("\nIMPORTANT: Update your .env or Config with this address!");
    console.log(`ROOT_TREASURY_ADDRESS=${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
