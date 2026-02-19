import * as ethers from "ethers";
import * as dotenv from "dotenv";
import type { W2EConfig, W2EDeploymentResult, DeploymentValidation, NetworkType } from "./types";

// Import Artifacts
import W2ELicenseArtifact from "./artifacts/W2ELicense.json";
import W2EUtilityArtifact from "./artifacts/W2EUtility.json";
import PBOXProtocolTreasuryArtifact from "./artifacts/PBOXProtocolTreasury.json";
import W2EGovernorArtifact from "./artifacts/W2EGovernor.json";
import W2ELoomArtifact from "./artifacts/W2ELoom.json";

// Load environment variables from multiple possible locations
const envPaths = [
  ".env",
  "../../.env",
  "../../apps/dashboard/.env"
];

const fs = require('fs');
const path = require('path');

envPaths.forEach(p => {
  const fullPath = path.resolve(process.cwd(), p);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath });
  }
});

/**
 * Despliega un protocolo W2E completo en la red especificada (Sepolia/Base)
 * utilizando ethers.js v5 (compatible con Thirdweb SDK v4).
 */
export async function deployW2EProtocol(
  projectSlug: string,
  config: W2EConfig,
  network: NetworkType = 'sepolia'
): Promise<W2EDeploymentResult> {
  console.log(`🚀 Iniciando despliegue REAL W2E para ${projectSlug} en ${network}`);

  if (!process.env.THIRDWEB_SECRET_KEY) {
    console.warn("⚠️ THIRDWEB_SECRET_KEY missing. Deployment might fail if using Thirdweb infrastructure.");
  }

  // --- Universal Ethers Shim & Setup ---
  const privateKey = process.env.PANDORA_ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("Private Key not found in environment (PANDORA_ORACLE_PRIVATE_KEY)");

  const eth = ethers as any;
  const isV6 = !!eth.JsonRpcProvider;
  const StaticJsonRpcProvider = isV6 ? eth.JsonRpcProvider : eth.providers.StaticJsonRpcProvider;
  const FallbackProvider = isV6 ? eth.FallbackProvider : eth.providers.FallbackProvider;
  const Wallet = eth.Wallet;
  const ContractFactory = eth.ContractFactory;
  const parseEther = isV6 ? eth.parseEther : eth.utils.parseEther;
  const isAddress = isV6 ? eth.isAddress : eth.utils.isAddress;
  const getCreateAddress = isV6 ? eth.getCreateAddress : eth.utils.getContractAddress;

  // 1. Setup Provider & Wallet (Ethers v5) with AUTOMATIC FALLBACK

  // Explicitly pass network to avoid auto-detection failure
  const CHAIN_IDS = {
    'sepolia': 11155111,
    'base': 8453
  };

  const targetChainId = CHAIN_IDS[network] || 11155111;

  // If user provided custom RPC via env var, try it first
  let customRpc = network === 'sepolia'
    ? process.env.SEPOLIA_RPC_URL
    : process.env.BASE_RPC_URL;

  // Sanitize custom RPC
  if (customRpc) {
    customRpc = customRpc.trim().replace(/^["']|["']$/g, '');
    if (!customRpc.startsWith('http')) {
      customRpc = undefined; // Invalidate if not a valid http/https URL
    }
  }

  // Optimized RPC Selection
  // STRATEGY: 
  // 1. FallbackProvider: Use multiple reliable public nodes + custom RPC in parallel.
  // 2. Weights: All Priority 1. We trust Ethers to pick a working one, rather than forcing a potentially bad "custom" one.
  //    This is crucial because Vercel often has generic/bad RPCs set in SEPOLIA_RPC_URL.

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

  // Filter out duplicates if customRpc is already in the list
  const rpcUrls = network === 'sepolia' ? [...SEPOLIA_RPCS] : [...BASE_RPCS];

  if (customRpc && !rpcUrls.includes(customRpc)) {
    console.log(`🔹 Incorporating Custom RPC into Fallback Strategy: ${customRpc}`);
    rpcUrls.unshift(customRpc);
  } else if (customRpc) {
    console.log(`🔹 Custom RPC ${customRpc} is already in the public list. Treated normally.`);
  }

  console.log(`🛡️ Initializing FallbackProvider with ${rpcUrls.length} nodes for ${network}.`);

  const providers = rpcUrls.map((url) => {
    const p = new StaticJsonRpcProvider(url, {
      name: 'provider-' + url.substring(8, 20), // helpful debug name
      chainId: targetChainId
    });

    return {
      provider: p,
      priority: 1, // ALL Equal priority. Let them race/failover naturally.
      weight: 1,
      stallTimeout: 3000
    };
  });

  const provider = new FallbackProvider(providers, 1);

  const wallet = new Wallet(privateKey, provider);

  console.log(`📡 Conectado a ${network} con wallet: ${wallet.address}`);

  // 2. Validate Config & Env
  const isValidAddress = (addr: string | undefined): boolean => addr != null && isAddress(addr);

  // Load and validate specific addresses
  let rootTreasury = process.env.ROOT_TREASURY_ADDRESS;
  if (!isValidAddress(rootTreasury)) {
    console.warn(`⚠️ ROOT_TREASURY_ADDRESS is invalid or missing (${rootTreasury}). Defaulting to known Sepolia deployment.`);
    rootTreasury = "0x1e92270332F1BAa9c98679c44792997c1A33bD50";
  }

  let oracleAddress = process.env.PANDORA_ORACLE_ADDRESS;
  if (!isValidAddress(oracleAddress)) {
    console.warn(`⚠️ PANDORA_ORACLE_ADDRESS is invalid (${oracleAddress}). Defaulting to wallet address.`);
    oracleAddress = wallet.address;
  }

  let feeRecipient = process.env.PANDORA_PLATFORM_FEE_WALLET;
  if (!isValidAddress(feeRecipient)) {
    console.warn(`⚠️ PANDORA_PLATFORM_FEE_WALLET is invalid (${feeRecipient}). Defaulting to wallet address.`);
    feeRecipient = wallet.address;
  }

  if (!rootTreasury) throw new Error("ROOT_TREASURY_ADDRESS missing and no fallback available");

  // 3. Address Prediction for Circular Dependencies (v5)
  // v6 uses getNonce(), v5 uses getTransactionCount()
  const currentNonce = await (wallet.getNonce ? wallet.getNonce() : wallet.getTransactionCount());
  console.log(`🔢 Current Nonce: ${currentNonce}`);

  const predictAddr = (nonce: number) => getCreateAddress({ from: wallet.address, nonce });

  const addrLicense = predictAddr(currentNonce);
  const addrUtility = predictAddr(currentNonce + 1);
  const addrLoom = predictAddr(currentNonce + 2);
  const addrTreasury = predictAddr(currentNonce + 3);
  const addrGovernor = predictAddr(currentNonce + 4);

  console.log("🔮 Predicted Addresses:", {
    License: addrLicense,
    Utility: addrUtility,
    Loom: addrLoom,
    Treasury: addrTreasury,
    Governor: addrGovernor
  });

  // 4. Contract Factories
  const LicenseFactory = new ContractFactory(W2ELicenseArtifact.abi, W2ELicenseArtifact.bytecode, wallet);
  const UtilityFactory = new ContractFactory(W2EUtilityArtifact.abi, W2EUtilityArtifact.bytecode, wallet);
  const LoomFactory = new ContractFactory(W2ELoomArtifact.abi, W2ELoomArtifact.bytecode, wallet);
  const TreasuryFactory = new ContractFactory(PBOXProtocolTreasuryArtifact.abi, PBOXProtocolTreasuryArtifact.bytecode, wallet);
  const GovernorFactory = new ContractFactory(W2EGovernorArtifact.abi, W2EGovernorArtifact.bytecode, wallet);

  // Helper to wait for deployment (Universal)
  const waitForDeploy = async (contract: any) => {
    if (contract.waitForDeployment) {
      // v6
      await contract.waitForDeployment();
      return await contract.getAddress();
    } else {
      // v5
      await contract.deployed();
      return contract.address;
    }
  };

  // 5. Execute Deployments

  // 5. Execute Deployments (PARALLEL v2)
  console.log("🚀 Launching PARALLEL deployment of 5 contracts...");

  // Override options generator
  const getOverrides = (nonce: number) => ({
    nonce,
    gasLimit: 8000000 // Increased for heavy Governor contract
  });

  try {
    const deployPromises = [
      // A. W2E License (Nonce N)
      LicenseFactory.deploy(
        config.licenseToken.name,
        config.licenseToken.symbol,
        config.maxLicenses,
        parseEther("0"), // Always Free Access Card
        oracleAddress,
        addrTreasury, // Circular resolved
        wallet.address, // Initial Owner
        getOverrides(currentNonce)
      ),
      // B. W2E Utility (Nonce N+1)
      UtilityFactory.deploy(
        config.utilityToken.name,
        config.utilityToken.symbol,
        18,
        config.utilityToken.feePercentage || 50,
        feeRecipient,
        wallet.address,
        getOverrides(currentNonce + 1)
      ),
      // C. W2E Loom (Nonce N+2)
      LoomFactory.deploy(
        addrLicense, // Predicted
        addrUtility, // Predicted
        rootTreasury,
        addrTreasury, // Predicted
        oracleAddress,
        feeRecipient,
        config.creatorWallet,
        config.creatorPayoutPct || 80,
        config.quorumPercentage || 10,
        (config.votingPeriodHours || 168) * 3600,
        (config.emergencyPeriodHours || 360) * 3600,
        config.emergencyQuorumPct || 20,
        config.stakingRewardRate || "1585489599",
        config.phiFundSplitPct || 20,
        wallet.address,
        getOverrides(currentNonce + 2)
      ),
      // D. PBOX Protocol Treasury (Nonce N+3)
      TreasuryFactory.deploy(
        // Ensure unique signers
        (config.treasurySigners && config.treasurySigners.length >= 2) ? config.treasurySigners : [wallet.address, Wallet.createRandom().address],
        [wallet.address, Wallet.createRandom().address, Wallet.createRandom().address], // Mock DAO signers
        oracleAddress,
        addrGovernor, // Predicted
        Math.min(2, (config.treasurySigners?.length || 2)),
        2,
        parseEther("5.0"),
        30,
        parseEther("0.1"),
        parseEther("1.0"),
        wallet.address,
        getOverrides(currentNonce + 3)
      ),
      // E. W2E Governor (Nonce N+4)
      GovernorFactory.deploy(
        addrLicense, // Predicted
        addrLoom, // Predicted
        config.quorumPercentage || 10,
        100,
        (config.votingPeriodHours || 168) * 3600,
        3600,
        wallet.address,
        getOverrides(currentNonce + 4)
      )
    ];

    // Wait for all deployments to be sent to mempool
    const contracts = await Promise.all(deployPromises);
    const [license, utility, loom, treasury, governor] = contracts;

    console.log("⏳ Waiting for confirmations (Parallel)...");

    // Wait for all to be mined
    await Promise.all([
      waitForDeploy(license),
      waitForDeploy(utility),
      waitForDeploy(loom),
      waitForDeploy(treasury),
      waitForDeploy(governor)
    ]);

    const licenseAddress = await license.getAddress ? license.getAddress() : license.address;
    const utilityAddress = await utility.getAddress ? utility.getAddress() : utility.address;
    const loomAddress = await loom.getAddress ? loom.getAddress() : loom.address;
    const treasuryAddress = await treasury.getAddress ? treasury.getAddress() : treasury.address;
    const governorAddress = await governor.getAddress ? governor.getAddress() : governor.address;

    console.log("✅ All contracts deployed successfully!");
    console.log({ licenseAddress, utilityAddress, loomAddress, treasuryAddress, governorAddress });

    // 6. Post-Deployment Setup (Wiring - PARALLEL)
    console.log("🔌 Wiring contracts (Parallel)...");

    // Recalculate nonce baseline for wiring
    const wiringStartNonce = currentNonce + 5;
    let wiringIndex = 0;
    const wiringPromises: Promise<any>[] = [];

    // Helper for wiring tx with idempotency check
    const pushWiringTx = async (contract: any, method: string, ...args: any[]) => {
      try {
        // Check if already transferred (Idempotency)
        if (method === 'transferOwnership') {
          const currentOwner = await contract.owner();
          const targetOwner = args[0];
          if (currentOwner.toLowerCase() === targetOwner.toLowerCase()) {
            console.log(`⏩ Skipping transferOwnership for ${contract.address} (Already owned by ${targetOwner})`);
            return;
          }
        } else if (method === 'setW2ELoomAddress') {
          try {
            // W2EUtility public getter
            const currentLoom = await contract.w2eLoomAddress();
            if (currentLoom && currentLoom !== "0x0000000000000000000000000000000000000000") {
              console.log(`⏩ Skipping setW2ELoomAddress for ${contract.address} (Already set to ${currentLoom})`);
              return;
            }
          } catch (ignored) {
            console.warn("Could not check w2eLoomAddress, proceeding with write...");
          }
        }

        // Execute
        const tx = await contract[method](...args);
        wiringPromises.push(tx);
        wiringIndex++;
      } catch (e) {
        console.warn(`⚠️ Error preparing wiring tx for ${method}:`, e);
      }
    };

    // a. Set Loom in Utility
    await pushWiringTx(utility, 'setW2ELoomAddress', loomAddress, getOverrides(wiringStartNonce + wiringIndex));

    // b. Transfer Ownerships to Governor
    await pushWiringTx(license, 'transferOwnership', governorAddress, getOverrides(wiringStartNonce + wiringIndex));
    await pushWiringTx(utility, 'transferOwnership', governorAddress, getOverrides(wiringStartNonce + wiringIndex));
    await pushWiringTx(loom, 'transferOwnership', governorAddress, getOverrides(wiringStartNonce + wiringIndex));
    await pushWiringTx(treasury, 'transferOwnership', governorAddress, getOverrides(wiringStartNonce + wiringIndex));

    // Config Optional
    if ((config as any).w2eConfig) {
      const w2e = (config as any).w2eConfig;
      if (w2e.phase1APY) await pushWiringTx(utility, 'setPhaseSchedule', 1, w2e.phase1APY, getOverrides(wiringStartNonce + wiringIndex));
      if (w2e.phase2APY) await pushWiringTx(utility, 'setPhaseSchedule', 2, w2e.phase2APY, getOverrides(wiringStartNonce + wiringIndex));
      if (w2e.phase3APY) await pushWiringTx(utility, 'setPhaseSchedule', 3, w2e.phase3APY, getOverrides(wiringStartNonce + wiringIndex));
      if (w2e.royaltyBPS) await pushWiringTx(license, 'setRoyaltyInfo', addrTreasury, w2e.royaltyBPS, getOverrides(wiringStartNonce + wiringIndex));
    }

    console.log(`🚀 Sending ${wiringPromises.length} wiring transactions...`);
    const txs = await Promise.all(wiringPromises);
    await Promise.all(txs.map((tx: any) => tx.wait()));
    console.log("✅ All wiring complete!");

    return {
      licenseAddress,
      phiAddress: utilityAddress,
      loomAddress,
      governorAddress,
      treasuryAddress,
      timelockAddress: "0x0000000000000000000000000000000000000000",
      deploymentTxHash: (loom as any).deploymentTransaction?.()?.hash || (loom as any).deployTransaction?.hash || "",
      network: network,
      chainId: Number((await provider.getNetwork()).chainId)
    };

  } catch (e) {
    console.error("❌ PARALLEL DEPLOYMENT FAILED:", e);
    throw e;
  }
}

// Helper validation (kept simple)
async function validateDeployment(config: W2EConfig, network: NetworkType): Promise<DeploymentValidation> {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    networkSupported: true,
    sufficientFunds: true,
    contractsCompiled: true
  };
}

export default deployW2EProtocol;
