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
  const privateKey = process.env.PANDORA_ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("Private Key not found in environment (PANDORA_ORACLE_PRIVATE_KEY)");

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
  let factoryAddress = process.env.PANDORAS_FACTORY_ADDRESS;
  if (!isValidAddress(factoryAddress)) {
    console.log("🏭 No valid Factory Address found. Deploying PandorasProtocolFactory on-the-fly...");
    const FactoryDeployer = new ContractFactory(PandorasProtocolFactoryArtifact.abi, PandorasProtocolFactoryArtifact.bytecode, wallet);
    const factoryContract = await FactoryDeployer.deploy();
    await factoryContract.deployed(); // or waitForDeployment based on ethers v5
    factoryAddress = factoryContract.address;
    console.log(`🏭 Factory deployed at: ${factoryAddress}`);
  } else {
    console.log(`🏭 Using existing Factory at: ${factoryAddress}`);
  }

  const factory = new eth.Contract(factoryAddress, PandorasProtocolFactoryArtifact.abi, wallet);

  // 4. Construct Factory Payload
  const primaryArtifact = artifactsToDeploy[0];
  if (!primaryArtifact) throw new Error("No artifacts found to deploy. Ensure artifacts list is not empty.");

  const salt = eth.utils.id(projectSlug || `w2e-project-${Date.now()}`);

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

    licenseName: primaryArtifact.name || `Licencia ${projectSlug}`,
    licenseSymbol: primaryArtifact.symbol || "VHORA",
    licenseMaxSupply: primaryArtifact.maxSupply || config.maxLicenses || 10000,
    licensePrice: parseEther(primaryArtifact.price || "0"),
    licenseTransferable: primaryArtifact.transferable ?? true,
    licenseBurnable: primaryArtifact.burnable ?? false,

    treasuryPandoraConfirmations: Math.min(2, (config.treasurySigners?.length || 2)),
    treasuryDaoConfirmations: 2,
    treasuryEmergencyThreshold: parseEther("5.0"),
    treasuryEmergencyInactivityDays: 30,
    treasuryDirectOperationLimit: parseEther("0.1"),
    treasuryDailySpendingLimit: parseEther("1.0"),

    initialOwner: wallet.address
  };

  const actorsStruct = {
    treasuryPandoraSigners: (config.treasurySigners && config.treasurySigners.length >= 2) ? config.treasurySigners : [wallet.address, Wallet.createRandom().address],
    treasuryDaoSigners: [wallet.address, Wallet.createRandom().address, Wallet.createRandom().address]
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

  // 5. Execute Atomic Deployment
  console.log(`📦 Sending atomic deployment transaction...`);
  try {
    const tx = await factory.deployProtocol(
      salt,
      configStruct,
      actorsStruct,
      bytecodesStruct,
      { gasLimit: 12000000 }
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
