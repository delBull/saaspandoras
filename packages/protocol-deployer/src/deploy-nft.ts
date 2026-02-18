import * as ethers from "ethers";
import * as dotenv from "dotenv";
import W2ELicenseArtifact from "./artifacts/W2ELicense.json";
import { NetworkType } from "./types";

// Load environment variables logic (reused from deploy.ts)
const fs = require('fs');
const path = require('path');

const envPaths = [
    ".env",
    "../../.env",
    "../../apps/dashboard/.env"
];

envPaths.forEach(p => {
    const fullPath = path.resolve(process.cwd(), p);
    if (fs.existsSync(fullPath)) {
        dotenv.config({ path: fullPath });
    }
});

export interface NFTPassConfig {
    name: string;
    symbol: string;
    maxSupply: string | number; // String to support MAX_UINT256
    price: string; // Ether string, e.g. "0.1"
    owner: string;
    treasuryAddress?: string; // Optional, defaults to owner if not set
    oracleAddress?: string; // Optional, defaults to owner if not set
}

export async function deployNFTPass(
    config: NFTPassConfig,
    network: NetworkType = 'sepolia'
): Promise<string> {
    console.log(`🚀 Starting NFT Pass Deployment: ${config.name} (${config.symbol})`);

    // --- Universal Ethers Shim & Setup ---
    const privateKey = process.env.PANDORA_ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("Private Key not found");

    const eth = ethers as any;
    const isV6 = !!eth.JsonRpcProvider;
    const StaticJsonRpcProvider = isV6 ? eth.JsonRpcProvider : eth.providers.StaticJsonRpcProvider;
    const FallbackProvider = isV6 ? eth.FallbackProvider : eth.providers.FallbackProvider;
    const Wallet = eth.Wallet;
    const ContractFactory = eth.ContractFactory;
    const parseEther = isV6 ? eth.parseEther : eth.utils.parseEther;

    // ... (RPC Logic omitted for brevity, assuming existing structure remains)
    // We need to keep the RPC selection logic intact.
    // I will use a targeted replacement for the function signature and the usage of maxSupply.

    // RE-INSERTING FULL FUNCTION CONTENT TO BE SAFE with correct handling
    if (!process.env.THIRDWEB_SECRET_KEY) {
        console.warn("⚠️ THIRDWEB_SECRET_KEY missing.");
    }

    // Multi-RPC fallback system with extensive public nodes
    const SEPOLIA_RPCS = [
        "https://rpc.sepolia.org",
        "https://ethereum-sepolia-rpc.publicnode.com",
        "https://rpc2.sepolia.org",
        "https://sepolia.gateway.tenderly.co",
        "https://ethereum-sepolia.blockpi.network/v1/rpc/public",
        "https://rpc.ankr.com/eth_sepolia",
        "https://eth-sepolia.public.blastapi.io",
        "https://1rpc.io/sepolia",
        "https://sepolia.drpc.org",
        "https://sepolia.infura.io/v3/46801ddf7514463493b8aa6fdd253322", // Public Infura key if available or general one
        "https://gateway.tenderly.co/public/sepolia",
        "https://sepolia.db3.app"
    ];

    const BASE_RPCS = [
        "https://mainnet.base.org",
        "https://base.llamarpc.com",
        "https://base.blockpi.network/v1/rpc/public",
        "https://base-rpc.publicnode.com",
        "https://1rpc.io/base",
        "https://base.drpc.org",
        "https://base-mainnet.public.blastapi.io",
        "https://base.gateway.tenderly.co",
        "https://base.meowrpc.com"
    ];

    let rpcCandidates = network === 'sepolia' ? [...SEPOLIA_RPCS] : [...BASE_RPCS];

    // Try custom RPC first if provided (and valid)
    let customRpc = network === 'sepolia' ? process.env.SEPOLIA_RPC_URL : process.env.BASE_RPC_URL;
    if (customRpc) {
        customRpc = customRpc.trim().replace(/^["']|["']$/g, '');
        // Validate it's a real URL and not a localized placeholder or empty
        if (customRpc.startsWith('http') && customRpc !== "https://rpc.sepolia.org") {
            // Add to front
            rpcCandidates.unshift(customRpc);
            console.log(`🔹 Custom RPC configured for ${network}`);
        }
    } else {
        console.log(`🔹 No custom RPC found for ${network}, using extensive public fallback list.`);
    }

    // Shuffle public RPCs (excluding the custom one if it's first) to verify against "thundering herd"
    // If we have a custom RPC at index 0, shuffle the rest. check index.
    const startIndex = customRpc ? 1 : 0;
    if (rpcCandidates.length > startIndex + 1) {
        // Fisher-Yates shuffle for the public nodes
        for (let i = rpcCandidates.length - 1; i > startIndex; i--) {
            const j = startIndex + Math.floor(Math.random() * (i - startIndex + 1));
            const temp = rpcCandidates[i];
            rpcCandidates[i] = rpcCandidates[j] as string;
            rpcCandidates[j] = temp as string;
        }
    }

    // Optimized RPC Selection: No pre-checks to save time.
    // We strictly use the top 3 most reliable public RPCs + 1 custom if provided.

    // 1. Filter candidates to top 3 to avoid long "stallTimeout" chains
    const PREFERRED_SEPOLIA_RPCS = [
        "https://rpc.ankr.com/eth_sepolia",
        "https://sepolia.drpc.org",
        "https://1rpc.io/sepolia"
    ];

    let activeCandidates = [...PREFERRED_SEPOLIA_RPCS];

    if (customRpc) {
        activeCandidates.unshift(customRpc);
        // Keep max 4
        if (activeCandidates.length > 4) activeCandidates.length = 4;
    }

    console.log(`🛡️ Initializing fast FallbackProvider with ${activeCandidates.length} nodes.`);

    const CHAIN_IDS = {
        'sepolia': 11155111,
        'base': 8453
    };
    const targetChainId = CHAIN_IDS[network] || 11155111;

    const validRpcProviders = activeCandidates.map((rpc, index) => {
        const p = new StaticJsonRpcProvider(rpc, {
            name: 'custom',
            chainId: targetChainId
        });

        return {
            provider: p,
            priority: index === 0 ? 1 : 2, // Prefer first one
            weight: 1,
            stallTimeout: 2500 // 2.5s timeout - Fail fast, try next
        };
    });

    // 2. Create FallbackProvider
    const provider = new FallbackProvider(validRpcProviders, 1);
    const wallet = new Wallet(privateKey, provider);

    console.log(`📡 Connected to ${network} with wallet: ${wallet.address}`);

    const LicenseFactory = new ContractFactory(W2ELicenseArtifact.abi, W2ELicenseArtifact.bytecode, wallet);

    // Deploy arguments for W2ELicense:
    // string memory _name,
    // string memory _symbol,
    // uint256 _maxLicenses,
    // uint256 _price,
    // address _oracle,
    // address _treasury,
    // address _initialOwner

    const oracle = config.oracleAddress || wallet.address;
    const treasury = config.treasuryAddress || wallet.address;
    const priceWei = parseEther(config.price || "0");

    // Ensure maxSupply is treated as BigInt/String for the contract call to avoid JS number overflow
    const maxSupplyBigInt = config.maxSupply.toString();

    console.log("Creating transaction...");

    const contract = await LicenseFactory.deploy(
        config.name,
        config.symbol,
        maxSupplyBigInt,
        priceWei,
        oracle,
        treasury,
        config.owner,
        { gasLimit: 3000000 } // Safe limit
    );

    console.log("⏳ Waiting for confirmation...");

    if (contract.waitForDeployment) {
        await contract.waitForDeployment();
    } else {
        await contract.deployed();
    }

    const address = contract.address || (await contract.getAddress());
    console.log(`✅ NFT Pass Deployed at: ${address}`);

    return address;
}
