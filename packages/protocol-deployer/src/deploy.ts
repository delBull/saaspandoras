import * as ethers from "ethers";
import * as dotenv from "dotenv";
import type { W2EConfig, W2EDeploymentResult, DeploymentValidation, NetworkType, ArtifactType } from "./types";

// Import Artifacts
import W2ELicenseArtifact from "./artifacts/W2ELicense.json";
import W2EUtilityArtifact from "./artifacts/W2EUtility.json";
import PBOXProtocolTreasuryArtifact from "./artifacts/PBOXProtocolTreasury.json";
import W2EGovernorArtifact from "./artifacts/W2EGovernor.json";
import W2ELoomV2Artifact from "./artifacts/W2ELoomV2.json";
import ProtocolRegistryArtifact from "./artifacts/ProtocolRegistry.json";

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

import PandorasProtocolFactoryArtifact from "./artifacts/PandorasProtocolFactory.json";

/**
 * Despliega un protocolo W2E completo en la red especificada (Sepolia/Base)
 * utilizando ethers.js v5 (compatible con Thirdweb SDK v4).
 */
export async function deployW2EProtocol(
  projectSlug: string,
  config: W2EConfig,
  network: NetworkType = 'sepolia'
): Promise<W2EDeploymentResult> {
  console.log(`🚀 Iniciando despliegue MODULAR W2E V2 para ${projectSlug} en ${network}`);

  if (!process.env.THIRDWEB_SECRET_KEY) {
    console.warn("⚠️ THIRDWEB_SECRET_KEY missing. Deployment might fail if using Thirdweb infrastructure.");
  }

  // --- Universal Ethers Shim & Setup ---
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.PANDORA_ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("Private Key not found in environment (DEPLOYER_PRIVATE_KEY or PANDORA_ORACLE_PRIVATE_KEY)");

  const eth = ethers as any;
  const isV6 = !!eth.JsonRpcProvider;
  const StaticJsonRpcProvider = isV6 ? eth.JsonRpcProvider : eth.providers.StaticJsonRpcProvider;
  const Wallet = eth.Wallet;
  const ContractFactory = eth.ContractFactory;
  const parseEther = isV6 ? eth.parseEther : eth.utils.parseEther;
  const isAddress = isV6 ? eth.isAddress : eth.utils.isAddress;

  // 1. Setup Provider & Wallet (Ethers v5) with AUTOMATIC FALLBACK
  const CHAIN_IDS = {
    'sepolia': 11155111,
    'base': 8453
  };

  const targetChainId = CHAIN_IDS[network] || 11155111;

  let customRpc = network === 'sepolia' ? process.env.SEPOLIA_RPC_URL : process.env.BASE_RPC_URL;
  if (customRpc) {
    customRpc = customRpc.trim().replace(/^["']|["']$/g, '');
  }

  const SEPOLIA_RPCS = [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://sepolia.drpc.org",
    "https://eth-sepolia.g.alchemy.com/v2/demo"
  ];

  const BASE_RPCS = [
    "https://mainnet.base.org",
    "https://base.llamarpc.com"
  ];

  const rpcUrls = network === 'sepolia' ? [...SEPOLIA_RPCS] : [...BASE_RPCS];
  if (customRpc && customRpc.startsWith('http')) rpcUrls.unshift(customRpc);

  let provider: ethers.providers.StaticJsonRpcProvider | undefined;
  for (const url of rpcUrls) {
    try {
      const tempProvider = new StaticJsonRpcProvider(url, { chainId: targetChainId, name: network });
      await Promise.race([
        tempProvider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
      ]);
      provider = tempProvider;
      break;
    } catch (e) { }
  }

  if (!provider) throw new Error(`No working RPC found for ${network}`);

  const wallet = new Wallet(privateKey, provider);
  console.log(`📡 Conectado a ${network} con wallet: ${wallet.address}`);

  // 2. Validate Config & Env
  const isValidAddress = (addr: string | undefined): boolean => addr != null && isAddress(addr);

  let rootTreasury = process.env.ROOT_TREASURY_ADDRESS || "0x1e92270332F1BAa9c98679c44792997c1A33bD50";
  let oracleAddress = isValidAddress(process.env.PANDORA_ORACLE_ADDRESS) ? process.env.PANDORA_ORACLE_ADDRESS! : wallet.address;
  let feeRecipient = isValidAddress(process.env.PANDORA_PLATFORM_FEE_WALLET) ? process.env.PANDORA_PLATFORM_FEE_WALLET! : wallet.address;

  // Artifacts definition
  const artifactsToDeploy = config.artifacts || (config.licenseToken ? [config.licenseToken] : []);
  if (artifactsToDeploy.length === 0) {
    artifactsToDeploy.push({ name: "Genesis License", symbol: "GEN", maxSupply: 1000, price: "0" });
  }

  // 3. Obtain Factory Address
  // FORCED HARDCODE: Prevent any accidental factory deployments
  let factoryAddress = "0x1d0048De43Ec28d8B76D5705C33113Ab3de6bc65";
  let factoryExists = false;

  if (isValidAddress(factoryAddress)) {
    const code = await provider.getCode(factoryAddress!);
    if (code !== "0x") {
        factoryExists = true;
    }
  }

  if (!factoryExists) {
    throw new Error(`CriticalInfrastructureError: No valid Factory Address found on-chain at ${factoryAddress}. Manual infrastructure deployment is required.`);
  }
  
  console.log(`🏭 Using existing Factory at: ${factoryAddress}`);


  const factory = new eth.Contract(factoryAddress, PandorasProtocolFactoryArtifact.abi, wallet);

  // 4. Construct Factory Payload
  const primaryArtifact = artifactsToDeploy[0];
  if (!primaryArtifact) throw new Error("No artifacts found to deploy. Ensure artifacts list is not empty.");

  // TODO (Phase 2): Replace projectSlug with immutable project.id during Protocol Kernel migration.
  // The slug is presentation, not identity. For now, this is deterministic enough to stop ETH bleeding.
  const uniqueId = projectSlug ? projectSlug : "w2e-project-default";
  const salt = eth.utils.id(uniqueId);

  const configStruct = {
    pandoraRootTreasury: rootTreasury,
    pandoraOracle: oracleAddress,
    platformFeeWallet: feeRecipient,
    creatorWallet: config.creatorWallet || wallet.address,
    creatorPayoutPct: config.creatorPayoutPct || 80,
    minQuorumPercentage: config.quorumPercentage || 10,
    votingPeriodSeconds: (config.votingPeriodHours || 168) * 3600,
    emergencyPeriodSeconds: (config.emergencyPeriodHours || 360) * 3600,
    emergencyQuorumPct: config.emergencyQuorumPct || 20,
    stakingRewardRate: config.stakingRewardRate || "1585489599",
    phiFundSplitPct: config.phiFundSplitPct || 20,

    utilityTokenName: config.utilityToken.name || `${projectSlug} Utility`,
    utilityTokenSymbol: config.utilityToken.symbol || "PHI",
    utilityFeePercentage: config.utilityToken.feePercentage || 50,
    utilityMaxSupply: config.utilityToken.maxSupply || 1000000,

    licenseName: primaryArtifact.name || `Licencia ${projectSlug}`,
    licenseSymbol: primaryArtifact.symbol || "VHORA",
    licenseMaxSupply: primaryArtifact.maxSupply || config.maxLicenses || 10000,
    licensePrice: parseEther(primaryArtifact.price || "0"),
    licenseTransferable: primaryArtifact.transferable ?? true,
    licenseBurnable: primaryArtifact.burnable ?? false,

    treasuryEmergencyThreshold: parseEther("5.0"),
    treasuryEmergencyInactivityDays: 30,
    treasuryDirectOperationLimit: parseEther("0.1"),
    treasuryDailySpendingLimit: parseEther("1.0"),

    initialOwner: wallet.address
  };

  const uniquePandoraSigners = Array.from(new Set(
    ((config.treasurySigners && config.treasurySigners.length >= 2) ? config.treasurySigners : [wallet.address, oracleAddress]).map(a => (a as string).toLowerCase())
  )).sort((a, b) => a.localeCompare(b));
  
  const uniqueDaoSigners = Array.from(new Set(
    [wallet.address, oracleAddress, rootTreasury].map(a => (a as string).toLowerCase())
  )).sort((a, b) => a.localeCompare(b));
  
  // Inject dynamically calculated confirmations back into configStruct
  (configStruct as any).treasuryPandoraConfirmations = Math.min(2, uniquePandoraSigners.length);
  (configStruct as any).treasuryDaoConfirmations = Math.min(2, uniqueDaoSigners.length);

  const actorsStruct = {
    treasuryPandoraSigners: uniquePandoraSigners,
    treasuryDaoSigners: uniqueDaoSigners
  };

  const getBytecode = (artifact: any) => {
    if (typeof artifact.bytecode === "string") return artifact.bytecode;
    if (artifact.bytecode && typeof artifact.bytecode.object === "string") return artifact.bytecode.object;
    return "0x";
  };

  const bytecodesStruct = {
    registry: getBytecode(ProtocolRegistryArtifact),
    utility: getBytecode(W2EUtilityArtifact),
    loom: getBytecode(W2ELoomV2Artifact),
    treasury: getBytecode(PBOXProtocolTreasuryArtifact),
    governor: getBytecode(W2EGovernorArtifact),
    license: getBytecode(W2ELicenseArtifact)
  };

  console.log(`⚛️ Predicting addresses with CREATE2 Factory...`);

  // Predict Ecosystem Addresses
  // We recreate the prediction logic locally or use static calls to the factory predictAddress function.
  const predictAddr = async (bytecode: string) => {
    return await factory.predictAddress(salt, bytecode);
  };

  const regInit = eth.utils.solidityPack(["bytes", "bytes"], [bytecodesStruct.registry, eth.utils.defaultAbiCoder.encode(["address"], [factoryAddress])]);
  const addrRegistry = await predictAddr(regInit);

  console.log(`⚛️ Expected Registry: ${addrRegistry}`);

  // DEPLOYMENT LOCK CHECK: Verify if already deployed
  // TEMPORARY: During Phase 1, blockchain is used as deployment lock.
  // Phase 2 replaces this with DeploymentCoordinator + DB lock.
  const registryCode = await provider.getCode(addrRegistry);
  if (registryCode !== "0x") {
    console.log(`✅ Protocol already deployed at Registry: ${addrRegistry}`);
    // PHASE 1: Fail-fast to stop ETH bleeding on retries. 
    // In Phase 2, this will be handled by the DeploymentCoordinator reading from the DB.
    throw new Error(`ALREADY_DEPLOYED_REGISTRY:${addrRegistry}`);
  }

  // 5. Validate Treasury Configuration BEFORE sending transaction
  validateTreasuryConfiguration(
    { address: wallet.address },
    oracleAddress,
    rootTreasury,
    config,
    isAddress
  );
  console.log(`✅ Treasury configuration validated — all constraints met`);

  // 6. Execute Atomic Deployment
  console.log(`📦 Sending atomic deployment transaction...`);
  try {
    const tx = await factory.deployProtocol(
      salt,
      configStruct,
      actorsStruct,
      bytecodesStruct
      // { gasLimit: 12000000 } // Removed hardcoded gasLimit to allow auto-estimation and avoid large upfront ETH requirement
    );

    console.log(`⏳ Waiting for block confirmation: ${tx.hash}`);
    const receipt = await tx.wait(1);

    // Parse emitted event to get final addresses
    const event = receipt.events?.find((e: any) => e.event === "ProtocolDeployed");
    if (!event) {
      throw new Error("ProtocolDeployed event missing from transaction receipt!");
    }

    const {
      registry: finalRegistry,
      utilityToken: finalUtility,
      loom: finalLoom,
      treasury: finalTreasury,
      governor: finalGovernor,
      licenseToken: finalLicense
    } = event.args;

    console.log("✅ Core stack deployed atomically!", { finalLoom, finalGovernor });

    // --- Post-Deploy Allocation (Minting) ---
    const utilityContract = new eth.Contract(finalUtility, W2EUtilityArtifact.abi, wallet);
    
    try {
        console.log(`🪙 Starting Post-Deploy Allocation for ${finalUtility}...`);
        
        // 1. Enter Initializing Mode (Skipped for V2)
        // const initTx = await utilityContract.setInitializing(true);
        // await initTx.wait();

        const totalCap = eth.BigNumber.from(config.utilityToken.initialSupply || "1000000");

        // 2. Mint Team Allocation
        if (config.utilityToken.teamAllocationBps && config.utilityToken.teamAllocationBps > 0 && config.utilityToken.teamWallet) {
            const teamAmount = totalCap.mul(config.utilityToken.teamAllocationBps).div(10000);
            console.log(`👥 Minting Team Allocation: ${teamAmount.toString()} to ${config.utilityToken.teamWallet}`);
            
            const currentBalance = await utilityContract.balanceOf(config.utilityToken.teamWallet);
            if (currentBalance.lt(teamAmount)) {
                const mintTx = await utilityContract.mint(config.utilityToken.teamWallet, teamAmount.sub(currentBalance), { gasLimit: 200000 });
                await mintTx.wait();
            }
        }

        // 3. Mint Pandoras Allocation
        if (config.utilityToken.pandorasAllocationBps && config.utilityToken.pandorasAllocationBps > 0 && config.utilityToken.pandorasWallet) {
            const pandorasAmount = totalCap.mul(config.utilityToken.pandorasAllocationBps).div(10000);
            console.log(`💎 Minting Pandoras Allocation: ${pandorasAmount.toString()} to ${config.utilityToken.pandorasWallet}`);
            
            const currentBalance = await utilityContract.balanceOf(config.utilityToken.pandorasWallet);
            if (currentBalance.lt(pandorasAmount)) {
                const mintTx = await utilityContract.mint(config.utilityToken.pandorasWallet, pandorasAmount.sub(currentBalance), { gasLimit: 200000 });
                await mintTx.wait();
            }
        }

        // 4. Exit Initializing Mode (Skipped for V2)
        // const endInitTx = await utilityContract.setInitializing(false);
        // await endInitTx.wait();
        
    } catch (mintError) {
        console.error("⚠️ Post-Deploy Minting encountered an error:", mintError);
    } finally {
        // 5. Mandatory Ownership Transfer to Governor
        console.log(`🔐 Transferring Utility Ownership to Governor: ${finalGovernor}`);
        try {
            const transferTx = await utilityContract.transferOwnership(finalGovernor, { gasLimit: 150000 });
            await transferTx.wait();
        } catch (transferError) {
             console.error("❌ CRITICAL: Failed to transfer ownership to Governor!", transferError);
        }

        // 6. Mandatory Ownership Transfer for License to Governor
        try {
            const licenseContract = new eth.Contract(finalLicense, W2ELicenseArtifact.abi, wallet);
            const lTransferTx = await licenseContract.transferOwnership(finalGovernor, { gasLimit: 150000 });
            await lTransferTx.wait();
        } catch (lTransferError) {
            console.error("❌ CRITICAL: Failed to transfer License ownership to Governor!", lTransferError);
        }
    }

    return {
      licenseAddress: finalLicense,
      phiAddress: finalUtility,
      loomAddress: finalLoom,
      governorAddress: finalGovernor,
      treasuryAddress: finalTreasury,
      registryAddress: finalRegistry,
      artifacts: [{
        type: primaryArtifact.type || 'Access',
        address: finalLicense
      }],
      timelockAddress: "0x0000000000000000000000000000000000000000",
      deploymentTxHash: tx.hash,
      network: network,
      chainId: targetChainId
    };

  } catch (e) {
    console.error("❌ ATOMIC DEPLOYMENT FAILED:", (e as any).message || e);
    throw e;
  }
}

/**
 * Validates Treasury constructor constraints BEFORE on-chain execution.
 * 
 * The Treasury constructor (from bytecode analysis) requires:
 *  - pandoraSigners.length >= 2
 *  - daoSigners.length >= 3
 *  - pandoraOracle != address(0)
 *  - requiredPandoraConfirmations >= 1 && <= pandoraSigners.length
 *  - requiredDaoConfirmations >= 2 && <= daoSigners.length
 *  - initialOwner != address(0)
 *
 * This prevents wasting gas on a revert that is 100% predictable.
 */
function validateTreasuryConfiguration(
  wallet: { address: string },
  oracleAddress: string,
  rootTreasury: string,
  config: W2EConfig,
  isAddress: (addr: string) => boolean,
): void {
  const ZERO = "0x0000000000000000000000000000000000000000";

  const pandoraSigners = (config.treasurySigners && config.treasurySigners.length >= 2)
    ? config.treasurySigners
    : [wallet.address, oracleAddress];

  const daoSigners = [wallet.address, oracleAddress, rootTreasury];

  const uniquePandora = [...new Set(pandoraSigners.map(a => a.toLowerCase()))];
  const uniqueDao = [...new Set(daoSigners.map(a => a.toLowerCase()))];

  if (uniquePandora.length < 2) {
    throw new Error(
      `ConfigurationError: Treasury needs >= 2 distinct Pandora signers ` +
      `(got ${uniquePandora.length}: ${uniquePandora.join(', ')}). ` +
      `Set PANDORA_ORACLE_ADDRESS to a different address or provide distinct treasurySigners.`
    );
  }

  if (uniqueDao.length < 3) {
    throw new Error(
      `ConfigurationError: Treasury needs >= 3 distinct DAO signers ` +
      `(got ${uniqueDao.length}: ${uniqueDao.join(', ')}). ` +
      `Ensure wallet, oracle, and rootTreasury are all distinct addresses.`
    );
  }

  if (!isAddress(oracleAddress) || oracleAddress === ZERO) {
    throw new Error(`ConfigurationError: PANDORA_ORACLE_ADDRESS is invalid or zero address.`);
  }

  const pandoraConfirmations = Math.min(2, uniquePandora.length);
  if (pandoraConfirmations < 1) {
    throw new Error(`ConfigurationError: treasuryPandoraConfirmations < 1.`);
  }

  const daoConfirmations = Math.min(2, uniqueDao.length);
  if (daoConfirmations < 2) {
    throw new Error(`ConfigurationError: treasuryDaoConfirmations < 2.`);
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
