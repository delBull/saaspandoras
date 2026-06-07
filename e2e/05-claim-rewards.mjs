import { parseAbi, encodeFunctionData } from "viem";
import { ENV } from "./config.mjs";
import { getSql } from "./db.mjs";
import { publicClient, adminAccount, getControllerState } from "./chain.mjs";

export async function run() {
  console.log("\n=== Fase E: Claim Rewards ===");

  const sql = getSql();
  const wallet = ENV.ADMIN.toLowerCase();
  const projectId = ENV.PROJECT_ID;

  // Seed a reward if none pending
  const pending = await sql`
    SELECT * FROM dao_rewards
    WHERE wallet_address = ${wallet} AND project_id = ${projectId} AND claimed_at IS NULL
  `;

  if (pending.length === 0) {
    console.log("No pending rewards. Seeding one...");
    await sql`
      INSERT INTO dao_rewards (project_id, wallet_address, amount, token, reason)
      VALUES (${projectId}, ${wallet}, 1.000000, 'USDC', 'e2e_test_reward')
    `;
  }

  // Reload
  const rewards = await sql`
    SELECT * FROM dao_rewards
    WHERE wallet_address = ${wallet} AND project_id = ${projectId} AND claimed_at IS NULL
  `;

  const totalAmount = rewards.reduce((sum, r) => sum + parseFloat(r.amount), 0);
  console.log(`Pending rewards: ${rewards.length}, total: ${totalAmount} USDC`);

  // Check/setup user balance
  const user = (await sql`
    SELECT * FROM user_balances WHERE wallet_address = ${wallet}
  `)[0];

  if (!user) {
    await sql`
      INSERT INTO user_balances (wallet_address, usdc_balance, pbox_balance, nonce)
      VALUES (${wallet}, 10.000000, 0.00, 0)
    `;
  }

  const userRecord = (await sql`
    SELECT * FROM user_balances WHERE wallet_address = ${wallet}
  `)[0];
  const nonce = userRecord.nonce;

  // Phase 1: DB lock
  const newBalance = (parseFloat(userRecord.usdc_balance) - totalAmount).toFixed(6);
  await sql`
    UPDATE user_balances
    SET usdc_balance = ${newBalance}::DECIMAL(18,6), nonce = ${nonce + 1}
    WHERE wallet_address = ${wallet}
  `;
  const [withdrawal] = await sql`
    INSERT INTO withdrawals (project_id, wallet_address, amount, token, status, nonce, signature)
    VALUES (${projectId}, ${wallet}, ${totalAmount.toFixed(6)}, 'USDC', 'processing', ${nonce}, 'e2e-claim')
    RETURNING id
  `;
  console.log(`DB lock: withdrawal #${withdrawal.id}`);

  // Phase 2: On-chain controller.withdraw
  const controllerABI = parseAbi(["function withdraw(address to, uint256 amount) external"]);
  const amountWei = BigInt(Math.round(totalAmount * 1_000_000));
  const data = encodeFunctionData({
    abi: controllerABI,
    functionName: "withdraw",
    args: [wallet, amountWei],
  });

  const gas = await publicClient.estimateGas({ account: adminAccount, to: ENV.CONTROLLER, data });
  const fee = await publicClient.estimateFeesPerGas();
  const nonceOnChain = await publicClient.getTransactionCount({ address: adminAccount.address });

  const signedTx = await adminAccount.signTransaction({
    to: ENV.CONTROLLER,
    data,
    gas,
    maxFeePerGas: fee.maxFeePerGas,
    maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
    nonce: nonceOnChain,
    chainId: 11155111n,
  });

  const txHash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx });
  console.log(`Claim tx sent: ${txHash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  // Phase 3: Settle DB + mark rewards claimed
  if (receipt.status === "success") {
    await sql`
      UPDATE withdrawals
      SET status = 'completed', tx_hash = ${txHash}, processed_at = NOW()
      WHERE id = ${withdrawal.id}
    `;
    await sql`
      UPDATE dao_rewards
      SET claimed_at = NOW(), tx_hash = ${txHash}, claim_batch_id = ${withdrawal.id}
      WHERE wallet_address = ${wallet} AND project_id = ${projectId} AND claimed_at IS NULL
    `;
    console.log("✅ Claim completed");
  } else {
    // Rollback
    await sql`
      UPDATE user_balances
      SET usdc_balance = ${userRecord.usdc_balance}::DECIMAL(18,6), nonce = ${nonce}
      WHERE wallet_address = ${wallet}
    `;
    await sql`
      UPDATE withdrawals
      SET status = 'failed', error = 'tx_reverted', processed_at = NOW()
      WHERE id = ${withdrawal.id}
    `;
    console.log("❌ Claim reverted, balance rolled back");
    return { ok: false, error: "tx_reverted" };
  }

  // Verify
  const claimed = await sql`
    SELECT * FROM dao_rewards
    WHERE wallet_address = ${wallet} AND project_id = ${projectId} AND claimed_at IS NOT NULL
    ORDER BY id DESC LIMIT ${rewards.length}
  `;
  console.log(`${claimed.length} rewards now marked as claimed`);

  return { ok: true, txHash };
}

if (process.argv[1] === import.meta.url) {
  run().then(console.log).catch(console.error);
}
