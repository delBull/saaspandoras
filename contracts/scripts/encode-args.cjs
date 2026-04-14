const { AbiCoder } = require("ethers");

async function main() {
  const initialAdmins = ["0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9", "0xc52BB6f53C91ff7134e7508B102E5A22BA415954"];
  const utilityAddress = "0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9";

  const abiCoder = new AbiCoder();
  const encodedParams = abiCoder.encode(
    ["address[]", "address"],
    [initialAdmins, utilityAddress]
  );

  console.log("ABI-encoded constructor arguments:");
  // Remove the '0x' prefix as Basescan expects it without it
  console.log(encodedParams.slice(2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});