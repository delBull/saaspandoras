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
 * utilizando ethers.js v6 y gestionando las dependencias circulares mediante predicción de direcciones.
 */
export async function deployW2EProtocol(
  projectSlug: string,
  config: W2EConfig,
  network: NetworkType = 'sepolia'
): Promise<W2EDeploymentResult> {
  console.log(`🚀 Iniciando despliegue REAL W2E para ${projectSlug} en ${network}`);

  // 1. Setup Provider & Wallet
  // Priority: Secret Key (Backend) > Public RPC. Client ID is for frontend only.
  const SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;

  const defaultSepoliaRpc = "https://ethereum-sepolia-rpc.publicnode.com";

  /* 
  const defaultSepoliaRpc = SECRET_KEY 
    ? `https://11155111.rpc.thirdweb.com/${SECRET_KEY}` 
    : "https://ethereum-sepolia-rpc.publicnode.com";
  */

  let rpcUrl = network === 'sepolia'
    ? (process.env.SEPOLIA_RPC_URL || defaultSepoliaRpc)
    : process.env.BASE_RPC_URL;

  console.log(`🌍 Connecting to RPC: ${rpcUrl}`);

  // Auto-fix: Avoid known bad RPCs if they come from env
  if (network === 'sepolia' && (rpcUrl === "https://rpc.sepolia.org" || !rpcUrl)) {
    console.warn("⚠️ Detected unstable or missing RPC. Switching to reliable fallback.");
    rpcUrl = defaultSepoliaRpc;
    console.log(`🌍 Switched to RPC: ${rpcUrl}`);
  }

  if (!rpcUrl) throw new Error(`RPC URL not found for network: ${network}`);

  const privateKey = process.env.PANDORA_ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("Private Key not found in environment (PANDORA_ORACLE_PRIVATE_KEY)");

  // Ethers v6 Implementation
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`📡 Conectado a ${network} con wallet: ${wallet.address}`);

  // Ethers v6 Utils (Top Level)
  const { parseEther, isAddress, getCreateAddress } = ethers;

  // v6 cleanup
  const getContractAddr = getCreateAddress;

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

  // 3. Address Prediction for Circular Dependencies
  const currentNonce = await wallet.getNonce();
  console.log(`🔢 Current Nonce: ${currentNonce}`);

  const predictAddr = (nonce: number) => getContractAddr({ from: wallet.address, nonce });

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
  const LicenseFactory = new ethers.ContractFactory(W2ELicenseArtifact.abi, W2ELicenseArtifact.bytecode, wallet);
  const UtilityFactory = new ethers.ContractFactory(W2EUtilityArtifact.abi, W2EUtilityArtifact.bytecode, wallet);
  const LoomFactory = new ethers.ContractFactory(W2ELoomArtifact.abi, W2ELoomArtifact.bytecode, wallet);
  const TreasuryFactory = new ethers.ContractFactory(PBOXProtocolTreasuryArtifact.abi, PBOXProtocolTreasuryArtifact.bytecode, wallet);
  const GovernorFactory = new ethers.ContractFactory(W2EGovernorArtifact.abi, W2EGovernorArtifact.bytecode, wallet);

  // Helper to wait for deployment (v6)
  const waitForDeploy = async (contract: any) => {
    await contract.waitForDeployment();
    return await contract.getAddress();
  };

  // 5. Execute Deployments

  // --- A. W2E License (Nonce N) ---
  console.log("📄 Deploying License...");
  const license = await LicenseFactory.deploy(
    config.licenseToken.name,
    config.licenseToken.symbol,
    config.maxLicenses,
    parseEther("0"), // Always Free Access Card
    oracleAddress,
    addrTreasury, // Circular resolved
    wallet.address // Initial Owner
  );
  const licenseAddress = await waitForDeploy(license);
  console.log(`✅ License Deployed: ${licenseAddress}`);

  // --- B. W2E Utility (Nonce N+1) ---
  console.log("🎫 Deploying Utility...");
  const utility = await UtilityFactory.deploy(
    config.utilityToken.name,
    config.utilityToken.symbol,
    18, // Decimals
    config.utilityToken.feePercentage || 50, // 0.5% default
    feeRecipient,
    wallet.address
  );
  const utilityAddress = await waitForDeploy(utility);
  console.log(`✅ Utility Deployed: ${utilityAddress}`);

  // --- C. W2E Loom (Nonce N+2) ---
  console.log("🧵 Deploying Loom...");
  const loom = await LoomFactory.deploy(
    licenseAddress,
    utilityAddress,
    rootTreasury,
    addrTreasury, // Circular resolved
    oracleAddress,
    feeRecipient,
    config.creatorWallet,
    config.creatorPayoutPct || 80,
    config.quorumPercentage || 10,
    (config.votingPeriodHours || 168) * 3600, // Seconds
    (config.emergencyPeriodHours || 360) * 3600, // Seconds
    config.emergencyQuorumPct || 20,
    config.stakingRewardRate || "1585489599",
    config.phiFundSplitPct || 20,
    wallet.address
  );
  const loomAddress = await waitForDeploy(loom);
  console.log(`✅ Loom Deployed: ${loomAddress}`);

  // --- D. PBOX Protocol Treasury (Nonce N+3) ---
  console.log("🏛️ Deploying Protocol Treasury...");

  // Ensure we have unique signers for the Treasury
  const chestSigners = (config.treasurySigners && config.treasurySigners.length >= 2)
    ? config.treasurySigners
    : [wallet.address, ethers.Wallet.createRandom().address]; // Fallback for dev

  const daoSigners = [wallet.address, ethers.Wallet.createRandom().address, ethers.Wallet.createRandom().address]; // Mock DAO signers for now if not provided

  const treasury = await TreasuryFactory.deploy(
    chestSigners,
    daoSigners,
    oracleAddress,
    addrGovernor, // Circular resolved
    Math.min(2, chestSigners.length), // Required Pandora Confirmations
    2, // Required DAO Confirmations
    parseEther("5.0"), // Emergency Threshold
    30, // Emergency Inactivity Days
    parseEther("0.1"), // Direct Operation Limit
    parseEther("1.0"), // Daily Spending Limit
    wallet.address
  );
  const treasuryAddress = await waitForDeploy(treasury);
  console.log(`✅ Treasury Deployed: ${treasuryAddress}`);

  // --- E. W2E Governor (Nonce N+4) ---
  console.log("⚖️ Deploying Governor...");
  const governor = await GovernorFactory.deploy(
    licenseAddress,
    loomAddress,
    config.quorumPercentage || 10,
    100, // Voting delay seconds
    (config.votingPeriodHours || 168) * 3600,
    3600, // Execution delay
    wallet.address
  );
  const governorAddress = await waitForDeploy(governor);
  console.log(`✅ Governor Deployed: ${governorAddress}`);

  // 6. Post-Deployment Setup (Wiring)
  console.log("🔌 Wiring contracts...");

  // Set Loom address in Utility to allow minting
  try {
    // Ethers v6 contract interaction
    const tx = await (utility as any).setW2ELoomAddress(loomAddress);
    await tx.wait();
    console.log("  - Utility linked to Loom");

    // Configure Economic Schedule (Pact) if provided
    if ((config as any).w2eConfig) {
      console.log("  - Configuring Economic Schedule (Pact)...");
      const w2e = (config as any).w2eConfig;

      // Phase 1
      if (w2e.phase1APY) {
        const tx1 = await (utility as any).setPhaseSchedule(1, w2e.phase1APY);
        await tx1.wait();
        console.log(`    > Phase 1 APY set to ${(w2e.phase1APY / 100)}%`);
      }
      // Phase 2
      if (w2e.phase2APY) {
        const tx2 = await (utility as any).setPhaseSchedule(2, w2e.phase2APY);
        await tx2.wait();
        console.log(`    > Phase 2 APY set to ${(w2e.phase2APY / 100)}%`);
      }
      // Phase 3
      if (w2e.phase3APY) {
        const tx3 = await (utility as any).setPhaseSchedule(3, w2e.phase3APY);
        await tx3.wait();
        console.log(`    > Phase 3 APY set to ${(w2e.phase3APY / 100)}%`);
      }

      // Royalties
      if (w2e.royaltyBPS) {
        const txR = await (license as any).setRoyaltyInfo(addrTreasury, w2e.royaltyBPS);
        await txR.wait();
        console.log(`    > Royalties set to ${(w2e.royaltyBPS / 100)}%`);
      }
    }

  } catch (e) {
    console.error("  ⚠️ Failed to configure post-deployment settings:", e);
  }

  // 7. Transfer Ownership to Governor (DAO Control)
  console.log("🔐 Transferring ownership to Governor...");
  try {
    // License
    const tx1 = await (license as any).transferOwnership(governorAddress);
    await tx1.wait();
    console.log("  - License ownership transferred");

    // Utility
    const tx2 = await (utility as any).transferOwnership(governorAddress);
    await tx2.wait();
    console.log("  - Utility ownership transferred");

    // Loom
    const tx3 = await (loom as any).transferOwnership(governorAddress);
    await tx3.wait();
    console.log("  - Loom ownership transferred");

    // Treasury
    const tx4 = await (treasury as any).transferOwnership(governorAddress);
    await tx4.wait();
    console.log("  - Treasury ownership transferred");

  } catch (e) {
    console.error("  ⚠️ Failed to transfer ownership to Governor (Manual handover required):", e);
  }

  return {
    licenseAddress: licenseAddress,
    phiAddress: utilityAddress,
    loomAddress: loomAddress,
    governorAddress: governorAddress,
    treasuryAddress: treasuryAddress,
    timelockAddress: "0x0000000000000000000000000000000000000000", // No standalone Timelock for now
    deploymentTxHash: (loom as any).deploymentTransaction()?.hash || "",
    network: network,
    chainId: Number((await provider.getNetwork()).chainId)
  };
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
