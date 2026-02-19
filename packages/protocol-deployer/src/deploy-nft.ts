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

    const CHAIN_IDS = {
        'sepolia': 11155111,
        'base': 8453
    };
    const targetChainId = CHAIN_IDS[network] || 11155111;

    let customRpc = network === 'sepolia' ? process.env.SEPOLIA_RPC_URL : process.env.BASE_RPC_URL;
    if (customRpc) {
        customRpc = customRpc.trim().replace(/^["']|["']$/g, '');
        if (!customRpc.startsWith('http')) {
            customRpc = undefined;
        }
    }

    // Optimized RPC Selection
    // STRATEGY: 
    // 1. FallbackProvider: Use multiple reliable public nodes + custom RPC in parallel.
    // 2. Weights: All Priority 1.
    // 3. Network Strictness: We must ensure all providers are explicitly configured for the same network to avoid "provider mismatch".

    const SEPOLIA_RPCS = [
        "https://rpc.ankr.com/eth_sepolia",
        "https://sepolia.drpc.org",
        "https://1rpc.io/sepolia",
        "https://rpc2.sepolia.org",
        "https://sepolia.gateway.tenderly.co",
        "https://ethereum-sepolia-rpc.publicnode.com"
    ];

    const BASE_RPCS = [
        "https://mainnet.base.org",
        "https://base.llamarpc.com",
        "https://base.drpc.org",
        "https://1rpc.io/base"
    ];

    const rpcUrls = network === 'sepolia' ? [...SEPOLIA_RPCS] : [...BASE_RPCS];

    // Filter out duplicates if customRpc is already in the list
    if (customRpc && !rpcUrls.includes(customRpc)) {
        console.log(`🔹 Incorporating Custom RPC into Fallback Strategy: ${customRpc}`);
        rpcUrls.unshift(customRpc);
    } else if (customRpc) {
        console.log(`🔹 Custom RPC ${customRpc} is already in the public list. Treated normally.`);
    }

    console.log(`🛡️ Initializing FallbackProvider with ${rpcUrls.length} nodes for ${network} (ChainID: ${targetChainId}).`);

    // Ethers v5 FallbackProvider requires all providers to have the same Network object.
    const providers = rpcUrls.map((url) => {
        const p = new StaticJsonRpcProvider(url, {
            chainId: targetChainId,
            name: network === 'sepolia' ? 'sepolia' : 'base'
        });

        return {
            provider: p,
            priority: 1,
            weight: 1,
            stallTimeout: 2500 // 2.5s stall timeout
        };
    });

    const provider = new FallbackProvider(providers, 1);

    // Ensure wallet is connected to the chosen provider
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
