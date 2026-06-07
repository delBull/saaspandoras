import {
  createPublicClient,
  http,
  encodeFunctionData,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, base } from "viem/chains";

const FACTORY_ADDRESS = "0x5d9447a3e026c82f7b6266e4760a8b9f0ad9aa9a";

const FACTORY_ABI = parseAbi([
  "function deployController(address _owner, address _delegate, address _token, uint256 _dailyLimit) returns (address)",
  "event ControllerDeployed(address indexed controller, address indexed owner, address delegate, address token, uint256 dailyLimit)",
]);

function getViemChain() {
  return process.env.NODE_ENV === 'production' ? base : sepolia;
}

function getPrivateKey(): `0x${string}` {
  const key = process.env.PROTOCOL_ADMIN_PRIVATE_KEY;
  if (!key) throw new Error("Protocol admin private key not configured");
  return (key.startsWith('0x') ? key : `0x${key}`) as `0x${string}`;
}

export async function deployProjectController(
  owner: string,
  token: string,
  dailyLimitWei: bigint,
): Promise<{ ok: true; controllerAddress: string; txHash: string } | { ok: false; error: string }> {
  try {
    const privateKey = getPrivateKey();
    const adminAccount = privateKeyToAccount(privateKey);
    const chain = getViemChain();
    const publicClient = createPublicClient({ chain, transport: http() });

    const adminAddress = adminAccount.address;

    const data = encodeFunctionData({
      abi: FACTORY_ABI,
      functionName: "deployController",
      args: [owner as `0x${string}`, adminAddress, token as `0x${string}`, dailyLimitWei],
    });

    const gas = await publicClient.estimateGas({ account: adminAccount, to: FACTORY_ADDRESS, data });
    const fee = await publicClient.estimateFeesPerGas();
    const nonce = await publicClient.getTransactionCount({ address: adminAddress });
    const cid = await publicClient.getChainId();

    const signedTx = await adminAccount.signTransaction({
      to: FACTORY_ADDRESS,
      data,
      gas,
      maxFeePerGas: fee.maxFeePerGas,
      maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
      nonce,
      chainId: cid,
    });

    const txHash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status !== 'success') {
      return { ok: false, error: `Factory deploy transaction reverted. Hash: ${txHash}` };
    }

    const eventTopic = "0x354140eb6fc5131bcd4e19aa2245d30638f0159cee068e19761e90291a80285b" as `0x${string}`;

    const deployLog = receipt.logs.find(
      (log: any) =>
        log.address.toLowerCase() === FACTORY_ADDRESS.toLowerCase() &&
        log.topics[0] === eventTopic,
    );

    if (!deployLog || !deployLog.topics[1]) {
      return { ok: false, error: "Controller deployed but could not extract address from event" };
    }

    const controllerAddress = ("0x" + deployLog.topics[1].slice(26)) as `0x${string}`;

    return { ok: true, controllerAddress, txHash };
  } catch (e: any) {
    return { ok: false, error: `Factory deploy failed: ${e.message}` };
  }
}

export async function getFactoryAddress(): Promise<string> {
  return FACTORY_ADDRESS;
}
