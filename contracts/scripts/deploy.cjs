/* eslint-disable @typescript-eslint/no-var-requires */
require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error("No se encontró ninguna cuenta para desplegar");
  }
  console.log("Desplegando contrato con la cuenta:", deployer.address);
  console.log("Balance de la cuenta deployer:", (await deployer.getBalance()).toString());

  const assetAddress =
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const vaultName = "Pandoras Pool Family & Friends";
  const vaultSymbol = "P1PFF";
  const ContractFactory = await ethers.getContractFactory(
    "TimeLockedInvestmentVault",
  );
  const contract = await ContractFactory.connect(
    deployer,
  ).deploy(assetAddress, vaultName, vaultSymbol);

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
