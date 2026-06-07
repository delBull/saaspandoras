import { createPublicClient, http, parseAbi } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { ENV } from "./config.mjs";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(ENV.RPC_URL),
});

const key = ENV.ADMIN_KEY.startsWith("0x") ? ENV.ADMIN_KEY : `0x${ENV.ADMIN_KEY}`;
export const adminAccount = privateKeyToAccount(key);

export const USDC_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

export const CONTROLLER_ABI = parseAbi([
  "function owner() view returns (address)",
  "function delegate() view returns (address)",
  "function dailyLimit() view returns (uint256)",
  "function spentToday() view returns (uint256)",
  "function remainingAllowance() view returns (uint256)",
  "function withdraw(address to, uint256 amount) external",
]);

export async function getUsdcBalance(address) {
  return publicClient.readContract({
    address: ENV.USDC,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [address],
  });
}

export async function getControllerState() {
  const [owner, delegate, remaining, spent, limit, balance] = await Promise.all([
    publicClient.readContract({ address: ENV.CONTROLLER, abi: CONTROLLER_ABI, functionName: "owner" }),
    publicClient.readContract({ address: ENV.CONTROLLER, abi: CONTROLLER_ABI, functionName: "delegate" }),
    publicClient.readContract({ address: ENV.CONTROLLER, abi: CONTROLLER_ABI, functionName: "remainingAllowance" }),
    publicClient.readContract({ address: ENV.CONTROLLER, abi: CONTROLLER_ABI, functionName: "spentToday" }),
    publicClient.readContract({ address: ENV.CONTROLLER, abi: CONTROLLER_ABI, functionName: "dailyLimit" }),
    getUsdcBalance(ENV.CONTROLLER),
  ]);
  return { owner, delegate, remaining, spent, limit, balance };
}
