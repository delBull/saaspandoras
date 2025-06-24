require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  console.log("DEBUG PRIVATE_KEY:", process.env.PRIVATE_KEY);
  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error("No se encontró ninguna cuenta para desplegar");
  }
  console.log("Desplegando contrato con la cuenta:", deployer.address);
  console.log("Balance de la cuenta deployer (wei):", (await deployer.getBalance()).toString());

  // Admins iniciales para el contrato (puedes agregar más addresses)
  const initialAdmins = [deployer.address];

  // Cambia estos addresses por los correctos de la red que uses
  const utilityAddress = deployer.address;
  const usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913"; // USDC Base Mainnet

  const ContractFactory = await ethers.getContractFactory("PoolFamilyAndFriends");
  const contract = await ContractFactory.connect(deployer).deploy(
    initialAdmins,
    utilityAddress,
    usdc
  );

  console.log("Transacción de despliegue enviada. Hash:", contract.deployTransaction.hash);
  console.log("Esperando confirmación…");

  await contract.deployed();
  console.log("Contrato desplegado en:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en el despliegue:", error);
    process.exit(1);
  });