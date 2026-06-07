import { db } from "~/db";
import { userBalances, withdrawals, projects } from "~/db/schema";
import { eq, sql, and, desc, or } from "drizzle-orm";
import {
  createPublicClient,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, base } from "viem/chains";
import {
  executeControllerWithdraw,
  controllerBalance,
  checkRemainingAllowance,
} from "./allowance";
import { getDynamicMinWithdraw } from "./gas-monitor";

const WITHDRAW_COOLDOWN_HOURS = Number(process.env.WITHDRAW_COOLDOWN_HOURS || "24");
const WITHDRAW_HARD_MIN = Number(process.env.WITHDRAW_HARD_MIN || "1");
const WITHDRAW_MAX_AMOUNT = Number(process.env.WITHDRAW_MAX_AMOUNT || "10000");

export interface WithdrawResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

function getPrivateKey(): string {
  const key = process.env.PROTOCOL_ADMIN_PRIVATE_KEY;
  if (!key) throw new Error("Protocol admin private key not configured");
  return key.startsWith('0x') ? key : `0x${key}`;
}

export function getAdminAddress(): string {
  const key = getPrivateKey();
  const account = privateKeyToAccount(key as `0x${string}`);
  return account.address;
}

/**
 * Checks if a wallet has a recent withdrawal in 'processing' or 'completed' status.
 * Returns hours remaining if cooldown active, null otherwise.
 * 'failed' withdrawals do NOT block — avoids punishing users for network errors.
 */
export async function checkWithdrawCooldown(
  wallet: string,
  projectId: number,
): Promise<number | null> {
  const recent = await db.query.withdrawals.findFirst({
    where: and(
      eq(withdrawals.walletAddress, wallet.toLowerCase()),
      eq(withdrawals.projectId, projectId),
      or(
        eq(withdrawals.status, 'processing'),
        eq(withdrawals.status, 'completed'),
      ),
    ),
    orderBy: desc(withdrawals.createdAt),
  });

  if (!recent) return null;

  const hoursSince = (Date.now() - new Date(recent.createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursSince < WITHDRAW_COOLDOWN_HOURS) {
    return Math.ceil(WITHDRAW_COOLDOWN_HOURS - hoursSince);
  }
  return null;
}

/**
 * Reads on-chain USDC balance of the AllowanceController.
 * The controller holds project funds and enforces daily limits.
 */
export async function verifyAdminBalance(
  amount: string,
): Promise<{ sufficient: boolean; balance: string; error?: string }> {
  try {
    const rawBalance = await controllerBalance();
    const balanceNum = Number(rawBalance) / 1_000_000;
    const amountNum = parseFloat(amount);

    return {
      sufficient: balanceNum >= amountNum,
      balance: balanceNum.toFixed(2),
    };
  } catch (e: any) {
    return { sufficient: false, balance: "0", error: `Failed to read controller balance: ${e.message}` };
  }
}

/**
 * Phase 1 (DB): deduct balance, insert withdrawal record, increment nonce.
 * Returns the withdrawal id or an error.
 */
export async function lockWithdrawal(
  wallet: string,
  projectId: number,
  amount: string,
  nonce: number,
  signature: string,
): Promise<{ ok: true; withdrawalId: number } | { ok: false; error: string }> {
  try {
    // Verify user has sufficient balance
    const balance = await db.query.userBalances.findFirst({
      where: eq(userBalances.walletAddress, wallet.toLowerCase()),
    });

    if (!balance) {
      return { ok: false, error: "User balance record not found" };
    }

    const currentBalance = parseFloat(balance.usdcBalance);
    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount > currentBalance) {
      return { ok: false, error: `Insufficient balance. Available: ${currentBalance.toFixed(2)} USDC` };
    }

    // Verify nonce matches
    if (balance.nonce !== nonce) {
      return { ok: false, error: `Invalid nonce. Expected ${balance.nonce}, got ${nonce}` };
    }

    // Phase 1 DB transaction: deduct balance, create withdrawal, increment nonce
    const result = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(userBalances)
        .set({
          usdcBalance: sql`CAST(${balance.usdcBalance} - ${withdrawAmount} AS DECIMAL(18,6))`,
          nonce: nonce + 1,
        })
        .where(and(
          eq(userBalances.walletAddress, wallet.toLowerCase()),
          eq(userBalances.nonce, nonce),
        ))
        .returning({ nonce: userBalances.nonce });

      if (!updated) {
        throw new Error("Nonce conflict — concurrent withdrawal detected, retry");
      }

      const [inserted] = await tx
        .insert(withdrawals)
        .values({
          projectId,
          walletAddress: wallet.toLowerCase(),
          amount,
          token: 'USDC',
          status: 'processing',
          nonce,
          signature,
        })
        .returning({ id: withdrawals.id });

      if (!inserted) throw new Error("Failed to create withdrawal record");
      return inserted.id;
    });

    return { ok: true, withdrawalId: result };
  } catch (e: any) {
    return { ok: false, error: `Failed to lock withdrawal: ${e.message}` };
  }
}

function getViemChain() {
  return process.env.NODE_ENV === 'production' ? base : sepolia;
}

/**
 * Phase 2a (blockchain): execute withdraw via AllowanceController.
 * The admin wallet (delegate) calls controller.withdraw(to, amount).
 * Controller holds the USDC and enforces daily limits.
 */
export async function executeTransfer(
  to: string,
  amount: string,
): Promise<{ ok: true; txHash: string } | { ok: false; error: string }> {
  return executeControllerWithdraw(to, amount);
}

import { sendTelegramAlert } from "~/lib/telegram";

/**
 * Phase 2b (DB): mark withdrawal completed or failed + rollback balance if failed.
 */
export async function settleWithdrawal(
  withdrawalId: number,
  wallet: string,
  amount: string,
  status: 'completed' | 'failed',
  txHash?: string,
  errorMsg?: string,
): Promise<void> {
  if (status === 'completed') {
    await db
      .update(withdrawals)
      .set({
        status: 'completed',
        txHash,
        processedAt: new Date(),
      })
      .where(eq(withdrawals.id, withdrawalId));
  } else {
    // Rollback: refund the balance
    await db.transaction(async (tx) => {
      await tx
        .update(userBalances)
        .set({
          usdcBalance: sql`CAST(${userBalances.usdcBalance} + ${parseFloat(amount)} AS DECIMAL(18,6))`,
        })
        .where(eq(userBalances.walletAddress, wallet.toLowerCase()));

      await tx
        .update(withdrawals)
        .set({
          status: 'failed',
          error: errorMsg || 'Unknown error',
          processedAt: new Date(),
        })
        .where(eq(withdrawals.id, withdrawalId));
    });

    // Alert admins on withdrawal failure (indicates empty controller, missing allowance, or RPC errors)
    await sendTelegramAlert(
      `<b>Withdrawal Failed!</b>\n` +
      `<b>Wallet:</b> <code>${wallet}</code>\n` +
      `<b>Amount:</b> ${amount} USDC\n` +
      `<b>Error:</b> ${errorMsg || 'Unknown on-chain error'}\n` +
      `<i>Check AllowanceController limits and balance immediately!</i>`
    );
  }
}

/**
 * Full 2-phase withdraw: lock → blockchain → settle.
 * Orchestrates the flow so route handlers don't duplicate logic.
 * The admin wallet executes transfer() — no treasury key needed.
 */
export async function transferUsdcToHolder(
  wallet: string,
  projectId: number,
  amount: string,
  nonce: number,
  signature: string,
): Promise<WithdrawResult> {
  // Validate amount bounds
  const amountNum = parseFloat(amount);
  const minWithdraw = await getDynamicMinWithdraw();
  const effectiveMin = Math.max(WITHDRAW_HARD_MIN, minWithdraw);
  if (amountNum < effectiveMin) {
    return { success: false, error: `Minimum withdrawal is ${effectiveMin} USDC (${minWithdraw > WITHDRAW_HARD_MIN ? 'gas-adjusted' : 'hard minimum'})` };
  }
  if (amountNum > WITHDRAW_MAX_AMOUNT) {
    return { success: false, error: `Maximum withdrawal is ${WITHDRAW_MAX_AMOUNT} USDC` };
  }

  // Cooldown check
  const cooldownHours = await checkWithdrawCooldown(wallet, projectId);
  if (cooldownHours !== null) {
    return { success: false, error: `Cooldown active. Try again in ${cooldownHours}h` };
  }

  // Verify admin wallet has enough USDC on-chain
  const adminCheck = await verifyAdminBalance(amount);
  if (!adminCheck.sufficient) {
    return {
      success: false,
      error: adminCheck.error || `Insufficient admin balance. Available: ${adminCheck.balance} USDC`,
    };
  }

  // Phase 1: DB lock
  const lock = await lockWithdrawal(wallet, projectId, amount, nonce, signature);
  if (!lock.ok) {
    return { success: false, error: lock.error };
  }

  // Phase 2a: Blockchain — admin sends USDC directly to user
  const exec = await executeTransfer(wallet, amount);

  // Phase 2b: Settle
  if (exec.ok) {
    await settleWithdrawal(lock.withdrawalId, wallet, amount, 'completed', exec.txHash);
    return { success: true, txHash: exec.txHash };
  } else {
    await settleWithdrawal(lock.withdrawalId, wallet, amount, 'failed', undefined, exec.error);
    return { success: false, error: exec.error };
  }
}
