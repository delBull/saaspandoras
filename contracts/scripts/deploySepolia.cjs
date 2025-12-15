const hre = require("hardhat");
const ethers = require("ethers"); // Using installed v5 directly
require("dotenv").config();

async function main() {
    console.log("🚀 Iniciando despliegue manual (Safe Mode)...");

    // 1. Setup Provider & Wallet manually
    // Using hre.network.config.url because hre.network.provider might be wrapped by broken plugin
    let provider;
    if (hre.network.name === 'hardhat') {
        provider = new ethers.providers.Web3Provider(hre.network.provider);
    } else {
        // Create JSON RPC Provider explicitly for the network
        provider = new ethers.providers.JsonRpcProvider(hre.network.config.url, hre.network.config.chainId);
    }

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log("- Cuenta:", wallet.address);
    console.log("- Balance:", (await wallet.getBalance()).toString());

    // 2. Load Artifacts
    const artifactName = "PoolPandorasSepolia";
    const artifact = await hre.artifacts.readArtifact(artifactName);

    // 3. Deployment Config
    const initialAdmins = [wallet.address];
    const utilityAddress = wallet.address;
    const trustedForwarder = "0x52C84043CD9c865236f11d9Fc9F56aa003c1f922"; // Address or 0x0
    const usdcSepolia = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

    console.log(`- Desplegando ${artifactName}...`);

    // 4. Factory & Deploy
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy(
        initialAdmins,
        utilityAddress,
        trustedForwarder,
        usdcSepolia
    );

    console.log("- Transacción enviada:", contract.deployTransaction.hash);
    await contract.deployed();

    console.log("✅ Contrato desplegado en:", contract.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error fatal:", error);
        process.exit(1);
    });
