import * as ethers from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

const envPaths = [
  "../../.env",
  "../../apps/dashboard/.env.local",
  "../../apps/dashboard/.env"
];

envPaths.forEach(p => {
  const fullPath = path.resolve(process.cwd(), p);
  if (fs.existsSync(fullPath)) dotenv.config({ path: fullPath });
});

async function main() {
  const privateKey = process.env.PROTOCOL_ADMIN_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("Private Key not found (try PROTOCOL_ADMIN_PRIVATE_KEY)");

  const network = process.env.NETWORK || 'base';
  const chainId = network === 'base' ? 8453 : 11155111;
  const rpcUrl = network === 'base'
    ? (process.env.BASE_RPC_URL || "https://mainnet.base.org")
    : (process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/demo");

  const eth = ethers as any;
  const StaticJsonRpcProvider = eth.providers.StaticJsonRpcProvider || eth.JsonRpcProvider;

  console.log(`Using RPC: ${rpcUrl}`);
  const provider = new StaticJsonRpcProvider(rpcUrl, chainId);
  const wallet = new eth.Wallet(privateKey, provider);

  console.log(`📡 Network: ${network === 'base' ? 'Base Mainnet' : 'Sepolia'}`);
  console.log(`📡 Wallet: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  const _owner = "0xc52BB6f53C91ff7134e7508B102E5A22BA415954";
  const _delegate = "0xaBA8a0d027FbaFa7316fBc08C5f4F2a78Be4f0E9";
  const _token = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const _dailyLimit = ethers.parseUnits("1000", 6);

  const ABI = [
    "constructor(address _owner, address _delegate, address _token, uint256 _dailyLimit)",
  ];

  const bytecodePath = path.join(__dirname, "../artifacts/AllowanceController.json");
  if (!fs.existsSync(bytecodePath)) {
    throw new Error(`Artifact not found at ${bytecodePath}. Build with: forge build --contracts treasury/AllowanceController.sol`);
  }

  const artifact = JSON.parse(fs.readFileSync(bytecodePath, "utf8"));

  console.log("\n🚀 Deploying AllowanceController on Base Mainnet...");
  console.log(`  Owner:    ${_owner}`);
  console.log(`  Delegate: ${_delegate}`);
  console.log(`  Token:    ${_token}`);
  console.log(`  Limit:    ${ethers.formatUnits(_dailyLimit, 6)} USDC`);

  const Factory = new eth.ContractFactory(ABI, artifact.bytecode, wallet);

  const contract = await Factory.deploy(_owner, _delegate, _token, _dailyLimit);
  if (contract.waitForDeployment) {
    await contract.waitForDeployment();
  } else {
    await contract.deployed();
  }

  const address = contract.target || contract.address;

  console.log(`\n✅ AllowanceController deployed!`);
  console.log(`📌 Address: ${address}`);
  console.log(`\nAdd to .env:`);
  console.log(`ALLOWANCE_CONTROLLER_ADDRESS="${address}"`);
}

main().catch((error: any) => {
  console.error(error);
  process.exitCode = 1;
});
