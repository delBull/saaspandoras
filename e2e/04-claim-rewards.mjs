import { encodeFunctionData, parseAbi } from "viem";
import { ENV } from "./config.mjs";
import { getSql } from "./db.mjs";
import { publicClient, adminAccount, CONTROLLER_ABI } from "./chain.mjs";

export async function run() {
  console.log("\n=== Phase D: Claim Rewards (via AllowanceController) ===");
  const sql = getSql();

  // Get all unclaimed rewards for both test users
  const testUsers = [ENV.TEST_USER1.toLowerCase(), ENV.TEST_USER2.toLowerCase()];
  const pendingRewards = [];
  for (const u of testUsers) {
    const rewards = await sql`
      SELECT * FROM dao_rewards
      WHERE wallet_address = ${u} AND project_id = ${ENV.PROJECT_ID} AND claimed_at IS NULL
      ORDER BY id
    `;
    for (const r of rewards) {
      pendingRewards.push({
        wallet: r.wallet_address,
        walletLower: r.wallet_address,
        amount: parseFloat(r.amount),
        reason: r.reason,
        id: r.id,
      });
    }
  }

  if (pendingRewards.length === 0) {
    console.log("  No pending rewards to claim");
    return { ok: true, skipped: true };
  }

  if (pendingRewards.length === 0) {
    console.log("  No pending rewards to claim");
    return { ok: true, skipped: true };
  }

  const totalAmount = pendingRewards.reduce((sum, r) => sum + r.amount, 0);
  const amountStr = totalAmount.toFixed(6);

  console.log(`  Pending: ${pendingRewards.length} rewards, total: ${amountStr} USDC`);

  // Read current state for verification
  const controllerRaw = await publicClient.readContract({
    address: ENV.USDC,
    abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
    functionName: "balanceOf",
    args: [ENV.CONTROLLER],
  });
  const balanceBefore = Number(controllerRaw);

  // Process each wallet separately (as in production)
  const claimed = [];
  for (const user of testUsers) {
    const userRewards = pendingRewards.filter(r => r.walletLower === user);
    if (userRewards.length === 0) continue;

    const userTotal = userRewards.reduce((sum, r) => sum + r.amount, 0);
    const userAmount = userTotal.toFixed(6);

    // Phase 1: DB lock (transactional)
    const [userBalance] = await sql`
      SELECT * FROM user_balances WHERE wallet_address = ${user}
    `;
    if (!userBalance) {
      console.log(`  ${user.slice(0,8)}...: NO user_balance record — skipping`);
      continue;
    }

    const balanceNum = parseFloat(userBalance.usdc_balance);
    if (balanceNum < userTotal) {
      console.log(`  ${user.slice(0,8)}...: Insufficient balance (${balanceNum} < ${userTotal}) — skipping`);
      continue;
    }

    // DB lock with nonce check
    const [updated] = await sql`
      UPDATE user_balances
      SET usdc_balance = ${ (balanceNum - userTotal).toFixed(6) }::DECIMAL(18,6),
          nonce = ${userBalance.nonce + 1}
      WHERE wallet_address = ${user}
      AND nonce = ${userBalance.nonce}
      RETURNING *
    `;

    if (!updated) {
      console.log(`  ${user.slice(0,8)}...: Nonce conflict — skipping`);
      continue;
    }

    // Create withdrawal record
    const [withdrawal] = await sql`
      INSERT INTO withdrawals (project_id, wallet_address, amount, token, status, nonce)
      VALUES (${ENV.PROJECT_ID}, ${user}, ${userAmount}, 'USDC', 'processing', ${userBalance.nonce})
      RETURNING id
    `;

    console.log(`  ${user.slice(0,8)}...: DB lock (withdrawal #${withdrawal.id}, -${userAmount} USDC)`);

    // Phase 2: On-chain controller.withdraw
    const data = encodeFunctionData({
      abi: CONTROLLER_ABI,
      functionName: "withdraw",
      args: [user, BigInt(Math.round(userTotal * 1_000_000))],
    });

    const nonce = await publicClient.getTransactionCount({ address: adminAccount.address });
    const fee = await publicClient.estimateFeesPerGas();
    const gas = await publicClient.estimateGas({ account: adminAccount, to: ENV.CONTROLLER, data });

    const signedTx = await adminAccount.signTransaction({
      to: ENV.CONTROLLER, data, gas,
      maxFeePerGas: fee.maxFeePerGas, maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
      nonce, chainId: 11155111n,
    });

    const txHash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx });
    console.log(`    tx sent: ${txHash}`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== "success") {
      // Rollback
      await sql`
        UPDATE user_balances
        SET usdc_balance = ${updated.usdc_balance}::DECIMAL(18,6), nonce = ${updated.nonce}
        WHERE wallet_address = ${user}
      `;
      await sql`
        UPDATE withdrawals SET status = 'failed', error = 'tx_reverted' WHERE id = ${withdrawal.id}
      `;
      console.log(`  ${user.slice(0,8)}...: TX reverted — rolled back`);
      continue;
    }

    // Phase 3: Settle — mark rewards claimed
    await sql`
      UPDATE withdrawals SET status = 'completed', tx_hash = ${txHash} WHERE id = ${withdrawal.id}
    `;
    await sql`
      UPDATE dao_rewards
      SET claimed_at = NOW(), tx_hash = ${txHash}, claim_batch_id = ${withdrawal.id}
      WHERE wallet_address = ${user}
      AND project_id = ${ENV.PROJECT_ID}
      AND claimed_at IS NULL
    `;

    const [newBalance] = await sql`
      SELECT usdc_balance FROM user_balances WHERE wallet_address = ${user}
    `;
    console.log(`  ${user.slice(0,8)}...: ✅ Claimed ${userAmount} USDC (new balance: ${newBalance.usdc_balance})`);
    claimed.push({ wallet: user, amount: userAmount });
  }

  // Verify controller balance decreased
  const controllerRawAfter = await publicClient.readContract({
    address: ENV.USDC,
    abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
    functionName: "balanceOf",
    args: [ENV.CONTROLLER],
  });
  const balanceAfter = Number(controllerRawAfter);
  const spent = balanceBefore - balanceAfter;
  console.log(`  Controller spent: ${(spent / 1_000_000).toFixed(2)} USDC`);

  console.log(`✅ Claims completed: ${claimed.length} wallets claimed`);
  return { ok: true, claimed, spent: spent / 1_000_000 };
}

if (process.argv[1] === import.meta.url) {
  run().then(console.log).catch(console.error);
}
