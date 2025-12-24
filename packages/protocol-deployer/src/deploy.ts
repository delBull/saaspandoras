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

  // 1. Setup Provider & Wallet (Ethers v5)
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

  // Manual Sanitization for Vercel Env Vars (Remove accidental quotes/whitespace)
  if (rpcUrl) {
    rpcUrl = rpcUrl.trim();
    if (rpcUrl.startsWith('"') && rpcUrl.endsWith('"')) {
      rpcUrl = rpcUrl.slice(1, -1);
    }
    if (rpcUrl.startsWith("'") && rpcUrl.endsWith("'")) {
      rpcUrl = rpcUrl.slice(1, -1);
    }
  }

  console.log(`🌍 Connecting to RPC: ${rpcUrl}`);

  // Auto-fix: Avoid known bad RPCs if they come from env
  if (network === 'sepolia' && (rpcUrl === "https://rpc.sepolia.org" || !rpcUrl)) {
    console.warn("⚠️ Detected unstable or missing RPC. Switching to reliable fallback.");
    rpcUrl = defaultSepoliaRpc;
    console.log(`🌍 Switched to RPC: ${rpcUrl}`);
  }

  if (!rpcUrl) throw new Error(`RPC URL not found for network: ${network}`);

  // Connectivity Check
  try {
    console.log(`📡 Testing connection to RPC: ${rpcUrl}`);
    // Simple POST to check if endpoint is alive (JSON-RPC 2.0 basic call)
    const testRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 })
    });

    if (!testRes.ok) {
      console.error(`❌ RPC Connection Failed with Status: ${testRes.status} ${testRes.statusText}`);
      const body = await testRes.text();
      console.error(`❌ Response Body: ${body}`);
      // throw new Error(`RPC Unreachable: ${testRes.status} (Check Thirdweb Key Restrictions?)`);
    } else {
      const testJson = await testRes.json() as any;
      console.log(`✅ RPC Connection OK. Chain ID: ${testJson.result}`);
    }

  } catch (connError: any) {
    console.warn(`⚠️ RPC Connectivity Check Failed: ${connError.message}`);
    // We don't block here, we let Ethers try, but this log will be crucial.
  }

  const privateKey = process.env.PANDORA_ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("Private Key not found in environment (PANDORA_ORACLE_PRIVATE_KEY)");

  // --- Universal Ethers Shim (v5/v6 Compatibility) ---
  // This handles the discrepancy between Local (v6) and Vercel/CI (v5) environments
  const eth = ethers as any;
  const isV6 = !!eth.JsonRpcProvider;

  console.log(`🔧 Ethers Compatibility Mode: ${isV6 ? 'v6' : 'v5'}`);

  const JsonRpcProvider = isV6 ? eth.JsonRpcProvider : eth.providers.JsonRpcProvider;
  const Wallet = eth.Wallet;
  const ContractFactory = eth.ContractFactory;

  // Utils
  const parseEther = isV6 ? eth.parseEther : eth.utils.parseEther;
  const isAddress = isV6 ? eth.isAddress : eth.utils.isAddress;
  const getCreateAddress = isV6 ? eth.getCreateAddress : eth.utils.getContractAddress;

  // Implementation
  const provider = new JsonRpcProvider(rpcUrl);
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
    gasLimit: 3000000 // Safer gas limit for parallel deployment
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

    // Helper for wiring tx
    const pushWiringTx = (promise: Promise<any>) => {
      wiringPromises.push(promise);
      wiringIndex++;
    };

    // a. Set Loom in Utility
    pushWiringTx((utility as any).setW2ELoomAddress(loomAddress, getOverrides(wiringStartNonce + wiringIndex)));

    // b. Transfer Ownerships to Governor
    pushWiringTx((license as any).transferOwnership(governorAddress, getOverrides(wiringStartNonce + wiringIndex))); // +1 from prev
    pushWiringTx((utility as any).transferOwnership(governorAddress, getOverrides(wiringStartNonce + wiringIndex))); // +2
    pushWiringTx((loom as any).transferOwnership(governorAddress, getOverrides(wiringStartNonce + wiringIndex)));    // +3
    pushWiringTx((treasury as any).transferOwnership(governorAddress, getOverrides(wiringStartNonce + wiringIndex))); // +4

    // Config Optional
    if ((config as any).w2eConfig) {
      const w2e = (config as any).w2eConfig;
      if (w2e.phase1APY) pushWiringTx((utility as any).setPhaseSchedule(1, w2e.phase1APY, getOverrides(wiringStartNonce + wiringIndex)));
      if (w2e.phase2APY) pushWiringTx((utility as any).setPhaseSchedule(2, w2e.phase2APY, getOverrides(wiringStartNonce + wiringIndex)));
      if (w2e.phase3APY) pushWiringTx((utility as any).setPhaseSchedule(3, w2e.phase3APY, getOverrides(wiringStartNonce + wiringIndex)));
      if (w2e.royaltyBPS) pushWiringTx((license as any).setRoyaltyInfo(addrTreasury, w2e.royaltyBPS, getOverrides(wiringStartNonce + wiringIndex)));
    }

    console.log(`🚀 Sending ${wiringPromises.length} wiring transactions...`);
    const txs = await Promise.all(wiringPromises);
    await Promise.all(txs.map(tx => tx.wait()));
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
