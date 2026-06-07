import { NextResponse } from "next/server";
import { db } from "~/db";
import { daoRewards, userBalances, withdrawals } from "~/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { verifyMessage } from "viem";
import { withSecurity, withdrawRateLimiter, isValidWalletAddress } from "~/lib/security-utils";
import {
  checkWithdrawCooldown,
  executeTransfer,
  settleWithdrawal,
  verifyAdminBalance,
} from "~/lib/treasury/withdraw";
import { checkRemainingAllowance } from "~/lib/treasury/allowance";
import { getDynamicMinWithdraw } from "~/lib/treasury/gas-monitor";

async function handler(request: Request): Promise<Response> {
  const body = await request.json();
  const { walletAddress, projectId, walletSignature, message } = body;

  if (!walletAddress || !projectId || !walletSignature || !message) {
    return NextResponse.json(
      { error: "Missing required fields: walletAddress, projectId, walletSignature, message" },
      { status: 400 },
    );
  }

  if (!isValidWalletAddress(walletAddress)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const pendingRewards = await db
    .select()
    .from(daoRewards)
    .where(
      and(
        eq(daoRewards.walletAddress, walletAddress.toLowerCase()),
        eq(daoRewards.projectId, projectId),
        isNull(daoRewards.claimedAt),
      ),
    );

  if (pendingRewards.length === 0) {
    return NextResponse.json({ error: "No pending rewards to claim" }, { status: 400 });
  }

  const totalAmount = pendingRewards.reduce(
    (sum, r) => sum + parseFloat(r.amount),
    0,
  );
  const amount = totalAmount.toFixed(6);

  const minWithdraw = await getDynamicMinWithdraw();
  if (totalAmount < minWithdraw) {
    return NextResponse.json(
      { error: `Total claim (${totalAmount.toFixed(2)} USDC) is below minimum (${minWithdraw} USDC)` },
      { status: 400 },
    );
  }

  const balance = await db.query.userBalances.findFirst({
    where: eq(userBalances.walletAddress, walletAddress.toLowerCase()),
  });

  if (!balance) {
    return NextResponse.json({ error: "User balance record not found" }, { status: 404 });
  }

  const userNonce = balance.nonce;

  const expectedMessage = `Claim ${amount} USDC rewards | Project ${projectId} | Nonce ${userNonce}`;
  if (message !== expectedMessage) {
    return NextResponse.json(
      { error: "Signed message does not match expected format. Include amount, projectId, and current nonce." },
      { status: 400 },
    );
  }

  const isValid = await verifyMessage({
    address: walletAddress as `0x${string}`,
    message,
    signature: walletSignature as `0x${string}`,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const cooldownHours = await checkWithdrawCooldown(walletAddress, projectId);
  if (cooldownHours !== null) {
    return NextResponse.json(
      { error: `Withdrawal cooldown active. Try again in ${cooldownHours}h` },
      { status: 429 },
    );
  }

  const adminCheck = await verifyAdminBalance(amount);
  if (!adminCheck.sufficient) {
    return NextResponse.json(
      {
        error: adminCheck.error || `Insufficient controller balance. Available: ${adminCheck.balance} USDC`,
      },
      { status: 400 },
    );
  }

  const remaining = await checkRemainingAllowance();
  const amountWei = BigInt(Math.round(totalAmount * 1_000_000));
  if (remaining < amountWei) {
    return NextResponse.json(
      { error: `Daily allowance exceeded. Remaining: ${Number(remaining) / 1_000_000} USDC` },
      { status: 400 },
    );
  }

  // Phase 1: Atomic DB transaction — deduct balance, create withdrawal, mark rewards claimed
  const lock = await db.transaction(async (tx) => {
    // 1. Explicit row lock to prevent any concurrent modifications (FOR UPDATE)
    const [lockedBalance] = await tx
      .select()
      .from(userBalances)
      .where(eq(userBalances.walletAddress, walletAddress.toLowerCase()))
      .for('update');
      
    if (!lockedBalance || lockedBalance.nonce !== userNonce) {
       throw new Error("Nonce conflict — concurrent claim detected, retry");
    }

    const [updated] = await tx
      .update(userBalances)
      .set({
        usdcBalance: sql`CAST(${balance.usdcBalance} - ${totalAmount} AS DECIMAL(18,6))`,
        nonce: userNonce + 1,
      })
      .where(and(
        eq(userBalances.walletAddress, walletAddress.toLowerCase()),
        eq(userBalances.nonce, userNonce),
      ))
      .returning({ nonce: userBalances.nonce });

    if (!updated) {
      throw new Error("Failed to update user balance");
    }

    const [inserted] = await tx
      .insert(withdrawals)
      .values({
        projectId,
        walletAddress: walletAddress.toLowerCase(),
        amount,
        token: 'USDC',
        status: 'processing',
        nonce: userNonce,
        signature: walletSignature,
      })
      .returning({ id: withdrawals.id });

    if (!inserted) throw new Error("Failed to create withdrawal record");

    await tx
      .update(daoRewards)
      .set({
        claimedAt: new Date(),
        claimBatchId: inserted.id,
      })
      .where(
        and(
          eq(daoRewards.walletAddress, walletAddress.toLowerCase()),
          eq(daoRewards.projectId, projectId),
          isNull(daoRewards.claimedAt),
        ),
      );

    return inserted.id;
  });

  // Phase 2a: On-chain — controller withdraw
  const exec = await executeTransfer(walletAddress, amount);

  // Phase 2b: Settle
  if (exec.ok) {
    await db
      .update(withdrawals)
      .set({
        status: "completed",
        txHash: exec.txHash,
        processedAt: new Date(),
      })
      .where(eq(withdrawals.id, lock));

    return NextResponse.json({
      success: true,
      txHash: exec.txHash,
      amount,
      rewardsClaimed: pendingRewards.length,
    });
  } else {
    await settleWithdrawal(lock, walletAddress, amount, "failed", undefined, exec.error);
    return NextResponse.json({ error: exec.error }, { status: 500 });
  }
}

export const POST = withSecurity(handler, { rateLimit: withdrawRateLimiter });
