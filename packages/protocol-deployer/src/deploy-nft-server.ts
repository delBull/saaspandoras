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

    const ALCHEMY_FALLBACK = "https://eth-sepolia.g.alchemy.com/v2/demo";
    const SEPOLIA_RPCS = [
        "https://ethereum-sepolia-rpc.publicnode.com",
        "https://sepolia.drpc.org",
        ALCHEMY_FALLBACK, // Move Alchemy down since it hangs often
        "https://rpc2.sepolia.org"
    ];

    const BASE_RPCS = [
        "https://mainnet.base.org",
        "https://base.llamarpc.com",
        "https://base.drpc.org"
    ];

    const rpcUrls = network === 'sepolia' ? [...SEPOLIA_RPCS] : [...BASE_RPCS];

    let customRpc = network === 'sepolia' ? process.env.SEPOLIA_RPC_URL : process.env.BASE_RPC_URL;
    if (customRpc) {
        customRpc = customRpc.trim().replace(/^["']|["']$/g, '');
        if (customRpc.startsWith('http')) {
            const idx = rpcUrls.indexOf(customRpc);
            if (idx > -1) rpcUrls.splice(idx, 1);
            rpcUrls.unshift(customRpc);
        }
    }

    const chainId = network === "sepolia" ? 11155111 : 8453;
    console.log(`🌍 [SERVER-MODE] Connecting to ${network} (ChainId: ${chainId}) via Deep Verification Strategy`);

    let provider: StaticJsonRpcProvider | undefined;

    for (const url of rpcUrls) {
        console.log(`[SERVER-MODE] Testing RPC: ${url}`);
        try {
            const tempProvider = new StaticJsonRpcProvider(url, {
                name: network,
                chainId: chainId
            });

            // Deep Check: simulate nonce check
            const testAddr = "0x0000000000000000000000000000000000000000";

            const nonce = await Promise.race([
                tempProvider.getTransactionCount(testAddr),
                new Promise((_, reject) => setTimeout(() => reject(new Error("RPC Timeout 4s")), 4000))
            ]);

            console.log(`✅ [SERVER-MODE] Deep Verified ${url} (Nonce: ${nonce})`);
            provider = tempProvider;
            break;
        } catch (e: any) {
            const msg = e.message || String(e);
            console.warn(`⚠️ [SERVER-MODE] Failed Deep Check for ${url}: ${msg.substring(0, 200)}...`);
        }
    }

    if (!provider) {
        console.error("❌ [SERVER-MODE] All RPCs failed deep health check.");
        throw new Error(`Critical: No working RPC provider found. Please check network restrictions.`);
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

    // Explicitly handle flags with defaults
    const isTransferable = config.transferable ?? true;
    const isBurnable = config.burnable ?? false;

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
        isTransferable,
        isBurnable,
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
