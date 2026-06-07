import { NextResponse } from "next/server";
import { db } from "~/db";
import { userBalances } from "~/db/schema";
import { eq } from "drizzle-orm";
import { verifyMessage } from "viem";
import { withSecurity, withdrawRateLimiter, isValidWalletAddress } from "~/lib/security-utils";
import {
  checkWithdrawCooldown,
  lockWithdrawal,
  executeTransfer,
  settleWithdrawal,
  verifyAdminBalance,
} from "~/lib/treasury/withdraw";
import {
  checkRemainingAllowance,
} from "~/lib/treasury/allowance";
import { getDynamicMinWithdraw } from "~/lib/treasury/gas-monitor";

async function handler(request: Request): Promise<Response> {
  const body = await request.json();
  const { walletAddress, projectId, amount, walletSignature, message } = body;

  // 1. Validate inputs
  if (!walletAddress || !projectId || !amount || !walletSignature || !message) {
    return NextResponse.json(
      { error: "Missing required fields: walletAddress, projectId, amount, walletSignature, message" },
      { status: 400 },
    );
  }

  if (!isValidWalletAddress(walletAddress)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const minWithdraw = await getDynamicMinWithdraw();
  if (amountNum < minWithdraw) {
    return NextResponse.json(
      { error: `Minimum withdrawal is ${minWithdraw} USDC (gas-adjusted)` },
      { status: 400 },
    );
  }

  // 2. Get user's current nonce
  const balance = await db.query.userBalances.findFirst({
    where: eq(userBalances.walletAddress, walletAddress.toLowerCase()),
  });

  if (!balance) {
    return NextResponse.json({ error: "User balance record not found" }, { status: 404 });
  }

  const userNonce = balance.nonce;

  // 3. Reconstruct expected message and validate signature
  const expectedMessage = `Withdraw ${amount} USDC | Project ${projectId} | Nonce ${userNonce}`;

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

  // 4. Cooldown check
  const cooldownHours = await checkWithdrawCooldown(walletAddress, projectId);
  if (cooldownHours !== null) {
    return NextResponse.json(
      { error: `Withdrawal cooldown active. Try again in ${cooldownHours}h` },
      { status: 429 },
    );
  }

  // 5. Admin balance check (AllowanceController holds USDC, admin pays gas)
  const adminCheck = await verifyAdminBalance(amount);
  if (!adminCheck.sufficient) {
    return NextResponse.json(
      {
        error: adminCheck.error || `Insufficient controller balance. Available: ${adminCheck.balance} USDC`,
      },
      { status: 400 },
    );
  }

  // 5b. Allowance pre-check — avoid wasting gas if daily limit exceeded
  const remaining = await checkRemainingAllowance();
  const amountWei = BigInt(Math.round(parseFloat(amount) * 1_000_000));
  if (remaining < amountWei) {
    return NextResponse.json(
      {
        error: `Daily allowance exceeded. Remaining: ${Number(remaining) / 1_000_000} USDC`,
      },
      { status: 400 },
    );
  }

  // 6. Phase 1: DB lock (deduct balance, insert withdrawal 'processing', increment nonce)
  const lock = await lockWithdrawal(walletAddress, projectId, amount, userNonce, walletSignature);
  if (!lock.ok) {
    return NextResponse.json({ error: lock.error }, { status: 400 });
  }

  // 7. Phase 2a: Blockchain — admin wallet sends USDC directly to user via transfer()
  const exec = await executeTransfer(walletAddress, amount);

  // 8. Phase 2b: Settle — complete or rollback
  if (exec.ok) {
    await settleWithdrawal(lock.withdrawalId, walletAddress, amount, 'completed', exec.txHash);
    return NextResponse.json({ success: true, txHash: exec.txHash });
  } else {
    await settleWithdrawal(lock.withdrawalId, walletAddress, amount, 'failed', undefined, exec.error);
    return NextResponse.json({ error: exec.error }, { status: 500 });
  }
}

export const POST = withSecurity(handler, { rateLimit: withdrawRateLimiter });
