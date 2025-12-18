const hre = require("hardhat");

async function main() {
    console.log("Starting deployment of ApplyPass...");

    // Default Trusted Forwarder for Sepolia (Thirdweb / Biconomy compatible)
    // If unsure, we can use a placeholder or a known one.
    // Using a common Thirdweb Forwarder address for Testnets:
    const TRUSTED_FORWARDER_SEPOLIA = "0xc82BbE41f2cF04e3a8efA18F7032BDD7f6d98a81";

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const ApplyPass = await hre.ethers.getContractFactory("ApplyPass");

    // Arguments: Name, Symbol, InitialOwner, TrustedForwarder
    const applyPass = await ApplyPass.deploy(
        "Pandoras Apply Pass",
        "PAP",
        deployer.address,
        TRUSTED_FORWARDER_SEPOLIA
    );

    await applyPass.deployed();

    console.log("ApplyPass deployed to:", applyPass.address);
    console.log("Trusted Forwarder:", TRUSTED_FORWARDER_SEPOLIA);

    // Verify command hint
    console.log(`\nVerify with: \nnpx hardhat verify --network sepolia ${applyPass.address} "Pandoras Apply Pass" "PAP" ${deployer.address} ${TRUSTED_FORWARDER_SEPOLIA}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
