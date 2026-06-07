import "dotenv/config";
import { createPublicClient, http, getContractAddress, keccak256, encodeAbiParameters, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, base } from "viem/chains";
import fs from "fs";
import path from "path";

const chain = process.env.NODE_ENV === 'production' ? base : sepolia;
const publicClient = createPublicClient({ chain, transport: http() });

const key = process.env.PROTOCOL_ADMIN_PRIVATE_KEY!;
const adminAccount = privateKeyToAccount((key.startsWith('0x') ? key : `0x${key}`) as `0x${string}`);

async function main() {
  const bytecodePath = path.resolve(__dirname, '../../../contracts/out/ControllerFactory.sol/ControllerFactory.json');
  const artifact = JSON.parse(fs.readFileSync(bytecodePath, 'utf8'));
  const bytecode = artifact.bytecode.object as `0x${string}`;

  const nonce = await publicClient.getTransactionCount({ address: adminAccount.address });
  const fee = await publicClient.estimateFeesPerGas();
  const cid = await publicClient.getChainId();
  const gas = await publicClient.estimateGas({ account: adminAccount, data: bytecode });

  const signedTx = await adminAccount.signTransaction({
    data: bytecode,
    gas,
    maxFeePerGas: fee.maxFeePerGas,
    maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
    nonce,
    chainId: cid,
  });

  const txHash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx });
  console.log("Deploy tx sent:", txHash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== 'success') {
    console.error("Deploy reverted");
    process.exit(1);
  }

  console.log("Deployed at:", receipt.contractAddress);
  console.log("Admin:", adminAccount.address);
}

main().catch(console.error);
