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
    maxSupply: number;
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

    if (!process.env.THIRDWEB_SECRET_KEY) {
        console.warn("⚠️ THIRDWEB_SECRET_KEY missing.");
    }

    // Multi-RPC fallback system (same as deploy.ts)
    const SEPOLIA_RPCS = [
        "https://ethereum-sepolia-rpc.publicnode.com",
        "https://rpc2.sepolia.org",
        "https://sepolia.gateway.tenderly.co",
        "https://ethereum-sepolia.blockpi.network/v1/rpc/public"
    ];

    const BASE_RPCS = [
        "https://mainnet.base.org",
        "https://base.llamarpc.com",
        "https://base.blockpi.network/v1/rpc/public",
        "https://base-rpc.publicnode.com"
    ];

    const rpcCandidates = network === 'sepolia' ? SEPOLIA_RPCS : BASE_RPCS;

    // Try custom RPC first if provided
    let customRpc = network === 'sepolia' ? process.env.SEPOLIA_RPC_URL : process.env.BASE_RPC_URL;
    if (customRpc) {
        customRpc = customRpc.trim().replace(/^["']|["']$/g, ''); // Remove quotes
        if (customRpc !== "https://rpc.sepolia.org" && customRpc !== "0x0000000000000000000000000000000000000000") {
            rpcCandidates.unshift(customRpc);
        }
    }

    console.log(`🌍 Attempting connection with ${rpcCandidates.length} RPC candidates...`);

    let rpcUrl: string | null = null;
    let lastError: Error | null = null;

    for (const candidateRpc of rpcCandidates) {
        try {
            console.log(`📡 Testing RPC: ${candidateRpc}`);
            const testRes = await fetch(candidateRpc, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 })
            });

            if (!testRes.ok) {
                console.warn(`❌ RPC Failed: ${candidateRpc} - ${testRes.status}`);
                lastError = new Error(`${testRes.status} ${testRes.statusText}`);
                continue;
            }

            const testJson = await testRes.json() as any;
            if (!testJson.result) {
                console.warn(`❌ Invalid response from: ${candidateRpc}`);
                lastError = new Error(`Invalid response`);
                continue;
            }

            console.log(`✅ RPC Connected: ${candidateRpc} (Chain: ${testJson.result})`);
            rpcUrl = candidateRpc;
            break;

        } catch (e: any) {
            console.warn(`❌ Connection failed: ${candidateRpc}`);
            lastError = e;
            continue;
        }
    }

    if (!rpcUrl) {
        throw new Error(
            `Failed to connect to ANY ${network} RPC.\n` +
            `Tried ${rpcCandidates.length} RPCs. Last error: ${lastError?.message || 'Unknown'}`
        );
    }

    // Connectivity Check (BLOCKING) - Same as deploy.ts
    try {
        console.log(`📡 Testing connection to RPC: ${rpcUrl}`);
        const testRes = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 })
        });

        if (!testRes.ok) {
            const body = await testRes.text();
            console.error(`❌ RPC Connection Failed: ${testRes.status} ${testRes.statusText}`);
            throw new Error(
                `RPC endpoint unreachable.\n` +
                `Network: ${network}\n` +
                `RPC URL: ${rpcUrl}\n` +
                `HTTP Status: ${testRes.status}\n` +
                `Response: ${body.slice(0, 200)}`
            );
        }

        const testJson = await testRes.json() as any;
        if (!testJson.result) {
            throw new Error(`RPC response missing chain ID: ${JSON.stringify(testJson)}`);
        }
        console.log(`✅ RPC Connection OK. Chain ID: ${testJson.result}`);
    } catch (connError: any) {
        console.error(`❌ RPC Connectivity Check FAILED:`, connError.message);
        throw new Error(
            `Failed to connect to ${network} RPC.\n` +
            `Error: ${connError.message}\n\n` +
            `Verify ${network === 'sepolia' ? 'SEPOLIA_RPC_URL' : 'BASE_RPC_URL'} in Vercel env vars.`
        );
    }

    const privateKey = process.env.PANDORA_ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("Private Key not found");

    // Ethers v5/v6 Shim
    const eth = ethers as any;
    const isV6 = !!eth.JsonRpcProvider;
    const JsonRpcProvider = isV6 ? eth.JsonRpcProvider : eth.providers.JsonRpcProvider;
    const Wallet = eth.Wallet;
    const ContractFactory = eth.ContractFactory;
    const parseEther = isV6 ? eth.parseEther : eth.utils.parseEther;

    const provider = new JsonRpcProvider(rpcUrl);
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

    console.log("Creating transaction...");

    const contract = await LicenseFactory.deploy(
        config.name,
        config.symbol,
        config.maxSupply,
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
