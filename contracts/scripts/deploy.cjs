/* eslint-disable @typescript-eslint/no-var-requires */
require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  console.log("DEBUG PRIVATE_KEY:", process.env.PRIVATE_KEY);
  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error(
      "No se encontró ninguna cuenta para desplegar",
    );
  }
  console.log(
    "Desplegando contrato con la cuenta:",
    deployer.address,
  );
  console.log(
    "Balance de la cuenta deployer (wei):",
    (await deployer.getBalance()).toString(),
  );

  // Admins iniciales para el contrato (puedes agregar más addresses)
  const initialAdmins = [deployer.address];

  const ContractFactory = await ethers.getContractFactory(
    "TimeLockedEthInvestmentVault",
  );
  const contract =
    await ContractFactory.connect(deployer).deploy(
      initialAdmins,
    );

  console.log(
    "Transacción de despliegue enviada. Hash:",
    contract.deployTransaction.hash,
  );
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
