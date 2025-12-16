const hre = require("hardhat");
const ethers = require("ethers"); // Using installed v5 directly
require("dotenv").config();

async function main() {
    console.log("🚀 Iniciando despliegue manual a SEPOLIA ETH...");

    // 1. Setup Provider & Wallet manually
    // Using hre.network.config.url from hardhat.config.ts
    const provider = new ethers.providers.JsonRpcProvider(hre.network.config.url, hre.network.config.chainId);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log("- Network:", hre.network.name);
    console.log("- Cuenta:", wallet.address);

    const balance = await wallet.getBalance();
    console.log("- Balance:", ethers.utils.formatEther(balance), "ETH");

    if (balance.eq(0)) {
        throw new Error("❌ Balance insuiciente. Por favor fondea la cuenta.");
    }

    // 2. Load Artifacts
    const artifactName = "PoolPandoras";
    const artifact = await hre.artifacts.readArtifact(artifactName);

    // 3. Deployment Config
    const initialAdmins = [wallet.address];
    const utilityAddress = wallet.address;
    const trustedForwarder = "0x52C84043CD9c865236f11d9Fc9F56aa003c1f922"; // Address or 0x0
    // USDC on Ethereum Sepolia
    // Circle USDC Sepolia: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
    const usdcSepolia = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

    console.log(`- Desplegando ${artifactName} en Sepolia...`);

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
