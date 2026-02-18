import { ethers, Wallet } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import W2ELicenseArtifact from "./artifacts/W2ELicense.json";
import { NFTPassConfig, NetworkType } from "./types";

/**
 * Server-Optimized NFT Pass Deployer
 * 
 * Designed for persistent environments (Railway, VPS, etc).
 * - Uses Single Premium RPC (no fallback complexity).
 * - Expects stable connection.
 * - Performs sanity checks before transaction.
 */
export async function deployNFTPassServer(
    config: NFTPassConfig,
    network: NetworkType
): Promise<string> {

    console.log(`[DEPLOY-SERVICE] 🚀 [SERVER-MODE] Deploying NFT Pass: ${config.name} (${config.symbol})`);

    // 1. Validate Config
    if (!config.name || !config.symbol) {
        throw new Error("[DEPLOY-SERVICE] Invalid NFT config: Name and Symbol are required.");
    }

    // 2. Load Env Vars
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY or PRIVATE_KEY missing");

    const rpcUrl =
        network === "sepolia"
            ? process.env.SEPOLIA_RPC_URL
            : process.env.BASE_RPC_URL;

    if (!rpcUrl) throw new Error(`RPC URL missing for ${network}`);

    const chainId = network === "sepolia" ? 11155111 : 8453;

    console.log(`🌍 [SERVER-MODE] Connecting to ${network} (ChainId: ${chainId}) via Premium RPC`);

    // 3. Initialize Provider (StaticJsonRpcProvider is best for single endpoint)
    const provider = new StaticJsonRpcProvider(rpcUrl, {
        name: network,
        chainId: chainId
    });

    // 4. Sanity Check (Fail Fast)
    try {
        const blockNumber = await provider.getBlockNumber();
        console.log(`✅ [SERVER-MODE] Connected. Current Block: ${blockNumber}`);
    } catch (e) {
        console.error("❌ [SERVER-MODE] RPC Connection Failed", e);
        throw new Error("Failed to connect to RPC provider. Check URL or Rate Limits.");
    }

    // 5. Setup Wallet & Factory
    const wallet = new Wallet(privateKey, provider);
    console.log(`📡 [SERVER-MODE] Deployer Wallet: ${wallet.address}`);

    const factory = new ethers.ContractFactory(
        W2ELicenseArtifact.abi,
        W2ELicenseArtifact.bytecode,
        wallet
    );

    // 6. Prepare Args
    const oracle = config.oracleAddress || wallet.address;
    const treasury = config.treasuryAddress || wallet.address;
    const priceWei = ethers.utils.parseEther(config.price || "0");
    // Ensure maxSupply is string for BigNumber safety
    const maxSupply = config.maxSupply.toString();

    console.log("⏳ [SERVER-MODE] Sending deployment transaction...");

    // 7. Deploy with explicit Gas Limit (safer for some chains)
    const contract = await factory.deploy(
        config.name,
        config.symbol,
        maxSupply,
        priceWei,
        oracle,
        treasury,
        config.owner,
        {
            gasLimit: 3_000_000 // Explicit limit to avoid estimation errors on some RPCs
        }
    );

    console.log(`📝 [SERVER-MODE] Tx Sent: ${contract.deployTransaction.hash}`);

    // 8. Wait for Confirmation
    await contract.deployed();

    console.log(`✅ [SERVER-MODE] Successfully Deployed at: ${contract.address}`);
    return contract.address;
}
