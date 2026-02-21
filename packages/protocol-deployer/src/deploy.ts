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
  const getCreateAddress = isV6 ? eth.getCreateAddress : eth.utils.getContractAddress;

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

  // Helper wait
  const waitForDeploy = async (contract: any) => {
    if (contract.waitForDeployment) await contract.waitForDeployment();
    else await contract.deployed();
    return contract.address;
  };

  // 3. Address Prediction for Ecosystem
  const currentNonce = await (wallet.getNonce ? wallet.getNonce() : wallet.getTransactionCount());
  const predictAddr = (nonce: number) => getCreateAddress({ from: wallet.address, nonce });

  const addrRegistry = predictAddr(currentNonce);
  const addrUtility = predictAddr(currentNonce + 1);
  const addrLoom = predictAddr(currentNonce + 2);
  const addrTreasury = predictAddr(currentNonce + 3);
  const addrGovernor = predictAddr(currentNonce + 4);

  // Artifacts will follow Governor
  const artifactsToDeploy = config.artifacts || (config.licenseToken ? [config.licenseToken] : []);
  const artifactCount = artifactsToDeploy.length;
  const artifactAddresses: string[] = [];
  for (let i = 0; i < artifactCount; i++) {
    artifactAddresses.push(predictAddr(currentNonce + 5 + i));
  }

  console.log("🔮 Predicted Ecosystem Addresses:", {
    Registry: addrRegistry,
    Utility: addrUtility,
    Loom: addrLoom,
    Treasury: addrTreasury,
    Governor: addrGovernor,
    Artifacts: artifactAddresses
  });

  // 4. Contract Factories
  const RegistryFactory = new ContractFactory(ProtocolRegistryArtifact.abi, ProtocolRegistryArtifact.bytecode, wallet);
  const UtilityFactory = new ContractFactory(W2EUtilityArtifact.abi, W2EUtilityArtifact.bytecode, wallet);
  const LoomV2Factory = new ContractFactory(W2ELoomV2Artifact.abi, W2ELoomV2Artifact.bytecode, wallet);
  const TreasuryFactory = new ContractFactory(PBOXProtocolTreasuryArtifact.abi, PBOXProtocolTreasuryArtifact.bytecode, wallet);
  const GovernorFactory = new ContractFactory(W2EGovernorArtifact.abi, W2EGovernorArtifact.bytecode, wallet);
  const LicenseFactory = new ContractFactory(W2ELicenseArtifact.abi, W2ELicenseArtifact.bytecode, wallet);

  // 5. Execute Deployments (PARALLEL v2)
  const getOverrides = (nonce: number) => ({
    nonce,
    gasLimit: 8000000
  });

  try {
    const corePromises = [
      // 0. Registry
      RegistryFactory.deploy(wallet.address, getOverrides(currentNonce)),

      // 1. PHI
      UtilityFactory.deploy(
        config.utilityToken.name,
        config.utilityToken.symbol,
        18,
        config.utilityToken.feePercentage || 50,
        feeRecipient,
        wallet.address,
        getOverrides(currentNonce + 1)
      ),

      // 2. Loom V2 (Ecosystem Enabled)
      LoomV2Factory.deploy(
        addrRegistry,
        addrUtility,
        rootTreasury,
        addrTreasury,
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

      // 3. Treasury
      TreasuryFactory.deploy(
        (config.treasurySigners && config.treasurySigners.length >= 2) ? config.treasurySigners : [wallet.address, Wallet.createRandom().address],
        [wallet.address, Wallet.createRandom().address, Wallet.createRandom().address],
        oracleAddress,
        addrGovernor,
        Math.min(2, (config.treasurySigners?.length || 2)),
        2,
        parseEther("5.0"),
        30,
        parseEther("0.1"),
        parseEther("1.0"),
        wallet.address,
        getOverrides(currentNonce + 3)
      ),

      // 4. Governor (Using predicted first artifact as vote token)
      GovernorFactory.deploy(
        artifactAddresses[0] || addrLoom, // Fallback to Loom if no artifacts (unlikely)
        addrLoom,
        config.quorumPercentage || 10,
        100,
        (config.votingPeriodHours || 168) * 3600,
        3600,
        wallet.address,
        getOverrides(currentNonce + 4)
      )
    ];

    // Deploy Artifacts in parallel with core
    const artifactPromises = artifactsToDeploy.map((art, i) => {
      return LicenseFactory.deploy(
        art.name,
        art.symbol,
        art.maxSupply || config.maxLicenses,
        parseEther(art.price || "0"),
        oracleAddress,
        addrTreasury,
        wallet.address,
        art.transferable ?? true,
        art.burnable ?? false,
        getOverrides(currentNonce + 5 + i)
      );
    });

    const [registry, utility, loom, treasury, governor] = await Promise.all(corePromises);
    const artifactsMined = await Promise.all(artifactPromises);

    console.log("⏳ Waiting for confirmations...");
    await Promise.all([
      waitForDeploy(registry),
      waitForDeploy(utility),
      waitForDeploy(loom),
      waitForDeploy(treasury),
      waitForDeploy(governor),
      ...artifactsMined.map(waitForDeploy)
    ]);

    console.log("✅ Core stack and artifacts deployed!");

    // 6. Wiring & Registration (Serial for Nonce management simplicity or parallel with offsets)
    const wiringStartNonce = currentNonce + 5 + artifactCount;
    let wiringIndex = 0;
    const wiringPromises: Promise<any>[] = [];

    const pushWiringTx = async (contract: any, method: string, ...args: any[]) => {
      const tx = await contract[method](...args);
      wiringPromises.push(tx);
      wiringIndex++;
    };

    // a. Link Utility to Loom
    await pushWiringTx(utility, 'setW2ELoomAddress', addrLoom, getOverrides(wiringStartNonce + wiringIndex));

    // b. Register Artifacts in Registry
    for (let i = 0; i < artifactCount; i++) {
      const typeId = 0; // Access by default for Access Pass
      // Mapping ArtifactType string to Enum uint8
      const typeMap: Record<ArtifactType, number> = {
        'Access': 0, 'Identity': 1, 'Membership': 2, 'Coupon': 3, 'Reputation': 4, 'Yield': 5
      };
      const art = artifactsToDeploy[i];
      if (!art) continue;
      const artType = art.type || 'Access';
      await pushWiringTx(registry, 'registerArtifact', artifactAddresses[i], typeMap[artType], getOverrides(wiringStartNonce + wiringIndex));
    }

    // c. Transfer Ownerships to Governor
    await pushWiringTx(registry, 'transferOwnership', addrGovernor, getOverrides(wiringStartNonce + wiringIndex));
    await pushWiringTx(utility, 'transferOwnership', addrGovernor, getOverrides(wiringStartNonce + wiringIndex));
    await pushWiringTx(loom, 'transferOwnership', addrGovernor, getOverrides(wiringStartNonce + wiringIndex));
    await pushWiringTx(treasury, 'transferOwnership', addrGovernor, getOverrides(wiringStartNonce + wiringIndex));
    for (const art of artifactsMined) {
      await pushWiringTx(art, 'transferOwnership', addrGovernor, getOverrides(wiringStartNonce + wiringIndex));
    }

    console.log(`🚀 Finalizing ${wiringPromises.length} wiring actions...`);
    const txs = await Promise.all(wiringPromises);
    await Promise.all(txs.map((tx: any) => tx.wait()));

    return {
      phiAddress: addrUtility,
      loomAddress: addrLoom,
      governorAddress: addrGovernor,
      treasuryAddress: addrTreasury,
      registryAddress: addrRegistry,
      artifacts: artifactAddresses.map((addr, i) => ({
        type: artifactsToDeploy[i]?.type || 'Access',
        address: addr
      })),
      timelockAddress: "0x0000000000000000000000000000000000000000",
      deploymentTxHash: (loom as any).deployTransaction?.hash || (loom as any).hash || "",
      network: network,
      chainId: targetChainId
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
