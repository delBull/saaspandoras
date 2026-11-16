/**
 * Hermes Paying Wallet Monitor & Insufficient Balance Alerting.
 *
 * Checks on-chain USDC and ETH (gas) balance of the secret paying wallet
 * configured in Vercel, masking the address to preserve privacy.
 * Dispatches alerts to Discord (DISCORD_WEBHOOK_PANDORAS_ALERTS) and Admin Email.
 */

import { createPublicClient, http, formatUnits, erc20Abi } from "viem";
import { base, baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { USDC_BASE, USDC_SEPOLIA } from "./onchain-verify";
import { sendBusinessNotification } from "@/lib/discord/business-notifier";

export interface PayingWalletStatus {
  configured: boolean;
  addressMasked: string | null;
  network: "base" | "base-sepolia";
  chainId: number;
  usdcBalance: number;
  ethBalance: number;
  status: "healthy" | "low" | "critical" | "not_configured";
  message: string;
}

/**
 * Masks an Ethereum address (e.g. 0x1234...5678) to preserve privacy.
 */
export function maskAddress(address: string): string {
  if (!address || address.length < 10) return "0x***";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Sends insufficient balance alert to Discord webhook and Admin Email.
 */
export async function notifyInsufficientPayingBalance(params: {
  addressMasked: string;
  usdcBalance: number;
  ethBalance: number;
  requiredAmount?: number;
  reason?: string;
}): Promise<void> {
  const details = {
    "Wallet Pagadora": params.addressMasked,
    "Saldo USDC": `$${params.usdcBalance.toFixed(4)} USDC`,
    "Gas ETH (Base)": `${params.ethBalance.toFixed(6)} ETH`,
    "Importe Requerido": params.requiredAmount ? `$${params.requiredAmount} USDC` : "N/A",
    "Motivo": params.reason ?? "Saldo insuficiente para búsquedas de Hermes",
    "Acción Requerida": "Recargar USDC o ETH en Base a la wallet pagadora configurada en Vercel",
  };

  try {
    // 1. Dispatch to Discord (DISCORD_WEBHOOK_PANDORAS_ALERTS)
    await sendBusinessNotification("Hermes x402: Saldo Insuficiente en Wallet Pagadora", details, "warning");
  } catch (err) {
    console.error("[PayingWalletMonitor] Failed to send Discord alert:", err);
  }

  // 2. Dispatch to Admin Email if configured
  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.PLATFORM_ADMIN_EMAIL;
  if (adminEmail) {
    try {
      const { sendAdminAlertEmail } = await import("@/lib/email/admin-alerts").catch(() => ({ sendAdminAlertEmail: null }));
      if (sendAdminAlertEmail) {
        await sendAdminAlertEmail({
          to: adminEmail,
          subject: "⚠️ ALERTA: Saldo bajo/crítico en Wallet Pagadora Hermes (x402)",
          text: `La wallet pagadora (${params.addressMasked}) tiene saldo insuficiente ($${params.usdcBalance.toFixed(2)} USDC / ${params.ethBalance.toFixed(4)} ETH). Por favor recargar fondos en Base.`,
        });
      }
    } catch {
      // Email delivery failure is non-fatal
    }
  }
}

/**
 * Checks on-chain balance of the secret paying wallet on Base / Base Sepolia.
 */
export async function getPayingWalletStatus(): Promise<PayingWalletStatus> {
  const privateKey =
    process.env.HERMES_AGENT_SIGNER_KEY ||
    process.env.PANDORAS_PAYING_WALLET_KEY;

  if (!privateKey || !privateKey.startsWith("0x") || privateKey.length < 64) {
    return {
      configured: false,
      addressMasked: null,
      network: "base",
      chainId: 8453,
      usdcBalance: 0,
      ethBalance: 0,
      status: "not_configured",
      message: "No configurada. Define HERMES_AGENT_SIGNER_KEY en Vercel Secrets.",
    };
  }

  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const address = account.address;
    const addressMasked = maskAddress(address);

    const isProduction = process.env.NODE_ENV === "production";
    const chain = isProduction ? base : baseSepolia;
    const chainId = chain.id;
    const usdcAddress = isProduction ? USDC_BASE : USDC_SEPOLIA;

    const publicClient = createPublicClient({ chain, transport: http() });

    // 1. Query ETH balance (gas)
    const ethBalanceRaw = await publicClient.getBalance({ address });
    const ethBalance = Number(formatUnits(ethBalanceRaw, 18));

    // 2. Query USDC ERC-20 balance
    const usdcBalanceRaw = await publicClient.readContract({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    });
    const usdcBalance = Number(formatUnits(usdcBalanceRaw, 6));

    let status: PayingWalletStatus["status"] = "healthy";
    let message = "Saldo óptimo para búsquedas y pagos autónomos.";

    if (usdcBalance < 0.10 || ethBalance < 0.0002) {
      status = "critical";
      message = "Saldo crítico. Hermes no podrá realizar búsquedas externas pagadas.";
      // Trigger alert notification
      await notifyInsufficientPayingBalance({
        addressMasked,
        usdcBalance,
        ethBalance,
        reason: "Saldo cayó por debajo del umbral mínimo de operación.",
      });
    } else if (usdcBalance < 1.00 || ethBalance < 0.0005) {
      status = "low";
      message = "Saldo bajo. Se recomienda recarga preventiva en Base.";
    }

    return {
      configured: true,
      addressMasked,
      network: isProduction ? "base" : "base-sepolia",
      chainId,
      usdcBalance,
      ethBalance,
      status,
      message,
    };
  } catch (err: any) {
    return {
      configured: true,
      addressMasked: "0x***",
      network: "base",
      chainId: 8453,
      usdcBalance: 0,
      ethBalance: 0,
      status: "critical",
      message: `Error al consultar saldo on-chain: ${err?.message ?? "Error RPC"}`,
    };
  }
}
