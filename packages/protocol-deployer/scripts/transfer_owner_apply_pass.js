const hre = require("hardhat");

async function main() {
    const contractAddress = "0xDBb729113F95C7Be1e6Aa976f5584ea0246e1cFE";
    const newOwner = "0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9";

    console.log(`Transferring ownership of ApplyPass at ${contractAddress} to ${newOwner}...`);

    const ApplyPass = await hre.ethers.getContractFactory("ApplyPass");
    const contract = ApplyPass.attach(contractAddress);

    const tx = await contract.transferOwnership(newOwner);
    console.log("Transaction hash:", tx.hash);

    await tx.wait();
    console.log("Ownership transferred successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
