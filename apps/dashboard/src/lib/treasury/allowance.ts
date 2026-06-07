import {
  createPublicClient,
  http,
  encodeFunctionData,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, base } from "viem/chains";
import { getUsdcAddress } from "./usdc-contract";

const CONTROLLER_ABI = parseAbi([
  "function withdraw(address to, uint256 amount) external",
  "function ownerWithdraw(address to, uint256 amount) external",
  "function setAllowance(address _delegate, uint256 _dailyLimit) external",
  "function remainingAllowance() view returns (uint256)",
  "function dailyLimit() view returns (uint256)",
  "function spentToday() view returns (uint256)",
  "function delegate() view returns (address)",
  "function owner() view returns (address)",
  "function token() view returns (address)",
  "event AllowanceSet(address indexed delegate, uint256 dailyLimit)",
  "event Withdraw(address indexed to, uint256 amount, string reason)",
]);

export function getControllerAddress(): `0x${string}` {
  const addr = process.env.ALLOWANCE_CONTROLLER_ADDRESS || "0x2E15a2e05a7d7399dB003e014aCB1De03Cea5cc9";
  return addr as `0x${string}`;
}

function getViemChain() {
  return process.env.NODE_ENV === 'production' ? base : sepolia;
}

function getPrivateKey(): `0x${string}` {
  const key = process.env.PROTOCOL_ADMIN_PRIVATE_KEY;
  if (!key) throw new Error("Protocol admin private key not configured");
  return (key.startsWith('0x') ? key : `0x${key}`) as `0x${string}`;
}

export function getAdminAddress(): `0x${string}` {
  return privateKeyToAccount(getPrivateKey()).address as `0x${string}`;
}

export async function checkRemainingAllowance(): Promise<bigint> {
  const chain = getViemChain();
  const client = createPublicClient({ chain, transport: http() });
  const allowance = await client.readContract({
    address: getControllerAddress(),
    abi: CONTROLLER_ABI,
    functionName: "remainingAllowance",
  });
  return allowance as bigint;
}

export async function checkDailyLimit(): Promise<bigint> {
  const chain = getViemChain();
  const client = createPublicClient({ chain, transport: http() });
  const limit = await client.readContract({
    address: getControllerAddress(),
    abi: CONTROLLER_ABI,
    functionName: "dailyLimit",
  });
  return limit as bigint;
}

export async function checkSpentToday(): Promise<bigint> {
  const chain = getViemChain();
  const client = createPublicClient({ chain, transport: http() });
  const spent = await client.readContract({
    address: getControllerAddress(),
    abi: CONTROLLER_ABI,
    functionName: "spentToday",
  });
  return spent as bigint;
}

export async function controllerBalance(): Promise<bigint> {
  const chain = getViemChain();
  const client = createPublicClient({ chain, transport: http() });
  const usdcAddress = getUsdcAddress() as `0x${string}`;
  const balance = await client.readContract({
    address: usdcAddress,
    abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
    functionName: "balanceOf",
    args: [getControllerAddress()],
  });
  return balance as bigint;
}

export async function executeControllerWithdraw(
  to: string,
  amount: string,
): Promise<{ ok: true; txHash: string } | { ok: false; error: string }> {
  try {
    const privateKey = getPrivateKey();
    const adminAccount = privateKeyToAccount(privateKey);
    const chain = getViemChain();
    const publicClient = createPublicClient({ chain, transport: http() });

    const data = encodeFunctionData({
      abi: CONTROLLER_ABI,
      functionName: "withdraw",
      args: [to as `0x${string}`, BigInt(Math.round(parseFloat(amount) * 1_000_000))],
    });

    const controllerAddress = getControllerAddress();
    const gas = await publicClient.estimateGas({ account: adminAccount, to: controllerAddress, data });
    const fee = await publicClient.estimateFeesPerGas();
    const nonce = await publicClient.getTransactionCount({ address: adminAccount.address });
    const cid = await publicClient.getChainId();

    const signedTx = await adminAccount.signTransaction({
      to: controllerAddress,
      data,
      gas,
      maxFeePerGas: fee.maxFeePerGas,
      maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
      nonce,
      chainId: cid,
    });

    const txHash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx });

    // --- Gas Tank Alert Monitor ---
    try {
      const ethBalance = await publicClient.getBalance({ address: adminAccount.address });
      // Alert if balance drops below 0.05 ETH
      if (ethBalance < 50000000000000000n) { 
        const { formatEther } = await import("viem");
        const { sendTelegramAlert } = await import("~/lib/telegram");
        await sendTelegramAlert(
          `⚠️ <b>Gas Tank Alert!</b>\n` +
          `Admin Wallet (<code>${adminAccount.address}</code>) has low ETH balance.\n` +
          `<b>Current Balance:</b> ${formatEther(ethBalance)} ETH\n\n` +
          `<i>Consider topping up or migrating to Thirdweb Engine / Relayer to scale!</i>`
        );
      }
    } catch (monitorErr) {
      console.warn("Gas monitor check failed:", monitorErr);
    }
    // ------------------------------

    return { ok: true, txHash };
  } catch (e: any) {
    return { ok: false, error: `Controller withdraw failed: ${e.message}` };
  }
}
