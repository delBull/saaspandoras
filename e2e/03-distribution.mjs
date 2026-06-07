import { encodeFunctionData, parseAbi, formatUnits } from "viem";
import { ENV } from "./config.mjs";
import { getSql } from "./db.mjs";
import { publicClient, adminAccount, CONTROLLER_ABI, USDC_ABI, getUsdcBalance } from "./chain.mjs";
import { checkEnv } from "./config.mjs";

export async function run() {
  console.log("\n=== Phase C: Distribution → Insert dao_rewards ===");
  const sql = getSql();

  checkEnv();

  // Get holders from daoMembers (pro-rata by voting power)
  const holders = await sql`
    SELECT wallet, voting_power FROM dao_members WHERE project_id = ${ENV.PROJECT_ID}
  `;
  if (holders.length === 0) {
    console.log("  No DAO members found");
    return { ok: false, error: "no_holders" };
  }

  // Read controller balance (source of funds)
  // First, top up controller with 15 USDC if empty (to enable the test flow)
  const initialBalance = await publicClient.readContract({
    address: ENV.USDC,
    abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
    functionName: "balanceOf",
    args: [ENV.CONTROLLER],
  });

  if (initialBalance === 0n) {
    console.log("  Controller has 0 USDC — sending top-up from admin...");
    const adminBalance = await getUsdcBalance(adminAccount.address);
    const amount = adminBalance < 15_000_000n ? adminBalance : 15_000_000n;
    if (amount < 10_000_000n) {
      console.log(`  ⚠️  Admin only has ${formatUnits(adminBalance, 6)} USDC — skipping top-up`);
      return { ok: false, error: "insufficient_admin_balance" };
    }
    const data = encodeFunctionData({
      abi: USDC_ABI,
      functionName: "transfer",
      args: [ENV.CONTROLLER, amount],
    });
    const nonce = await publicClient.getTransactionCount({ address: adminAccount.address });
    const fee = await publicClient.estimateFeesPerGas();
    const gas = await publicClient.estimateGas({ account: adminAccount, to: ENV.USDC, data });
    const signedTx = await adminAccount.signTransaction({
      to: ENV.USDC, data, gas,
      maxFeePerGas: fee.maxFeePerGas, maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
      nonce, chainId: 11155111n,
    });
    const txHash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx });
    console.log(`  Top-up tx: ${txHash}`);
    await publicClient.waitForTransactionReceipt({ hash: txHash });
  }

  const controllerRaw = await publicClient.readContract({
    address: ENV.USDC,
    abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
    functionName: "balanceOf",
    args: [ENV.CONTROLLER],
  });
  const totalUsdcWei = controllerRaw;
  const totalUsdcNum = Number(totalUsdcWei) / 1_000_000;
  if (totalUsdcNum <= 0) {
    console.log("  Controller balance = 0 — need to fund first");
    return { ok: false, error: "insufficient_balance" };
  }

  // Check remaining allowance
  const remaining = await publicClient.readContract({
    address: ENV.CONTROLLER,
    abi: CONTROLLER_ABI,
    functionName: "remainingAllowance",
  });
  if (remaining < totalUsdcWei) {
    console.log(`  Remaining allowance: ${remaining} (need ${totalUsdcWei})`);
    return { ok: false, error: "daily_limit_exceeded" };
  }

  console.log(`  Controller USDC: ${totalUsdcNum.toFixed(2)} | Remaining allowance: ${Number(remaining) / 1_000_000} USDC`);

  // Calculate pro-rata shares
  const totalVotingPower = holders.reduce((sum, h) => sum + Number(h.voting_power), 0);
  let distributed = 0;
  const rewardsToInsert = [];

  for (const h of holders) {
    const share = Number(h.voting_power) / totalVotingPower;
    const amount = (totalUsdcNum * share).toFixed(6);
    if (parseFloat(amount) <= 0) continue;
    distributed += parseFloat(amount);
    rewardsToInsert.push({
      projectId: ENV.PROJECT_ID,
      wallet: h.wallet.toLowerCase(),
      amount: amount,
    });
  }

  console.log(`  Distributing ${distributed.toFixed(2)} USDC to ${rewardsToInsert.length} holders`);

  // Insert dao_rewards + update balances (all in one transaction to avoid race)
  const now = new Date();
  const insertedRewards = [];
  for (const r of rewardsToInsert) {
    // Update balance first (if exists) or create new record
    const existing = await sql`
      SELECT * FROM user_balances WHERE wallet_address = ${r.wallet}
    `;
    if (existing.length > 0) {
      const newBal = (parseFloat(existing[0].usdc_balance) + parseFloat(r.amount)).toFixed(6);
      await sql`
        UPDATE user_balances SET usdc_balance = ${newBal}::DECIMAL(18,6)
        WHERE wallet_address = ${r.wallet}
      `;
    } else {
      await sql`
        INSERT INTO user_balances (wallet_address, usdc_balance, pbox_balance, nonce)
        VALUES (${r.wallet}, ${r.amount}, 0.00, 0)
      `;
    }

    // Insert dao_rewards
    await sql`
      INSERT INTO dao_rewards (project_id, wallet_address, amount, token, reason)
      VALUES (${r.projectId}, ${r.wallet}, ${r.amount}, 'USDC', 'profit_sharing')
      RETURNING id
    `;

    insertedRewards.push({ wallet: r.wallet, amount: r.amount });
    console.log(`    ${r.wallet.slice(0,8)}...: +${r.amount} USDC (reward)`);
  }

  // Log distribution batch (executed_by is required)
  const executed_by = ENV.ADMIN.toLowerCase();
  await sql`
    INSERT INTO distribution_batches (project_id, total_amount, total_holders, currency, status, executed_by, batch_metadata, created_at)
    VALUES (${ENV.PROJECT_ID}, ${distributed.toFixed(6)}, ${insertedRewards.length}, 'USDC', 'completed', ${executed_by}, ${JSON.stringify({ method: 'dao_rewards', rewards: insertedRewards })}, NOW())
  `;

  console.log(`✅ Distribution completed: ${insertedRewards.length} rewards inserted`);
  return { ok: true, distributed };
}

if (process.argv[1] === import.meta.url) {
  run().then(console.log).catch(console.error);
}
