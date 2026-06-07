import {
  createPublicClient,
  http,
  parseAbi,
  formatUnits,
} from "viem";
import { sepolia, base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { TelemetryService } from "~/lib/security/telemetry";

const GAS_WARN_THRESHOLD_ETH = process.env.GAS_WARN_THRESHOLD_ETH || "0.01";
const GAS_CRITICAL_THRESHOLD_ETH = process.env.GAS_CRITICAL_THRESHOLD_ETH || "0.005";
const ETH_USD_PRICE = process.env.ETH_USD_PRICE || "2500";
const CONTROLLER_GAS_ESTIMATE = 100_000n;

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

export async function getAdminEthBalance(): Promise<bigint> {
  const chain = getViemChain();
  const client = createPublicClient({ chain, transport: http() });
  return client.getBalance({ address: getAdminAddress() });
}

export async function getFormattedAdminEthBalance(): Promise<string> {
  const bal = await getAdminEthBalance();
  return formatUnits(bal, 18);
}

export async function getCurrentGasPrice(): Promise<bigint> {
  const chain = getViemChain();
  const client = createPublicClient({ chain, transport: http() });
  return client.getGasPrice();
}

export async function getGasCostInUsd(gasUnits: bigint = CONTROLLER_GAS_ESTIMATE): Promise<number> {
  const gasPrice = await getCurrentGasPrice();
  const totalWei = gasPrice * gasUnits;
  const totalEth = Number(formatUnits(totalWei, 18));
  const ethPrice = parseFloat(ETH_USD_PRICE);
  return totalEth * ethPrice;
}

export async function getDynamicMinWithdraw(): Promise<number> {
  const gasCostUsd = await getGasCostInUsd();
  const min = Math.max(1, Math.ceil(gasCostUsd * 2));
  return min;
}

export async function checkGasAndAlert(): Promise<{
  ok: boolean;
  balanceEth: string;
  gasPriceGwei: string;
  alertsSent: number;
}> {
  const balance = await getAdminEthBalance();
  const balanceEth = formatUnits(balance, 18);
  const gasPrice = await getCurrentGasPrice();
  const gasPriceGwei = formatUnits(gasPrice, 9);
  const warnThreshold = parseFloat(GAS_WARN_THRESHOLD_ETH);
  const criticalThreshold = parseFloat(GAS_CRITICAL_THRESHOLD_ETH);
  const balanceNum = parseFloat(balanceEth);
  let alertsSent = 0;

  if (balanceNum < criticalThreshold) {
    TelemetryService.sendAlert(
      "🚨 Gas CRITICAL — Admin Wallet",
      `Balance: ${balanceEth} ETH\nGas Price: ${gasPriceGwei} Gwei\nThreshold: ${criticalThreshold} ETH\nAction: Top up immediately or withdrawals will fail.`,
      "CRITICAL",
      { balanceEth, gasPriceGwei, threshold: criticalThreshold }
    );
    alertsSent++;
  } else if (balanceNum < warnThreshold) {
    TelemetryService.sendAlert(
      "⚠️ Gas LOW — Admin Wallet",
      `Balance: ${balanceEth} ETH\nGas Price: ${gasPriceGwei} Gwei\nThreshold: ${warnThreshold} ETH\nSchedule top-up soon.`,
      "HIGH",
      { balanceEth, gasPriceGwei, threshold: warnThreshold }
    );
    alertsSent++;
  }

  return {
    ok: balanceNum >= warnThreshold,
    balanceEth,
    gasPriceGwei,
    alertsSent,
  };
}
