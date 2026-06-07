import { privateKeyToAccount } from "viem/accounts";
import { parseAbi, encodeFunctionData } from "viem";
import { ENV } from "./config.mjs";
import { getSql } from "./db.mjs";
import { publicClient, adminAccount, getControllerState } from "./chain.mjs";

export async function run() {
  console.log("\n=== Fase C: Withdraw Flow ===");

  const sql = getSql();
  const wallet = ENV.ADMIN.toLowerCase();
  const amount = "2"; // 2 USDC
  const projectId = ENV.PROJECT_ID;

  // Check pre-state
  const stateBefore = await getControllerState();
  console.log(`Controller before: ${Number(stateBefore.balance) / 1e6} USDC, spent: ${Number(stateBefore.spent) / 1e6}`);

  // Ensure user_balances record
  const userBefore = await sql`
    SELECT * FROM user_balances WHERE wallet_address = ${wallet}
  `;
  if (userBefore.length === 0) {
    await sql`
      INSERT INTO user_balances (wallet_address, usdc_balance, pbox_balance, nonce)
      VALUES (${wallet}, 50.000000, 0.00, 0)
    `;
  }

  const user = (await sql`
    SELECT * FROM user_balances WHERE wallet_address = ${wallet}
  `)[0];
  const nonce = user.nonce;
  const amountNum = parseFloat(amount);
  const balanceNum = parseFloat(user.usdc_balance);

  if (balanceNum < amountNum) {
    console.log(`Insufficient balance: ${balanceNum} < ${amountNum}`);
    return { ok: false, error: "insufficient_balance" };
  }

  // Phase 1: DB lock (deduct balance, insert withdrawal)
  const newBalance = (balanceNum - amountNum).toFixed(6);
  const insertResult = await sql`
    UPDATE user_balances
    SET usdc_balance = ${newBalance}::DECIMAL(18,6), nonce = ${nonce + 1}
    WHERE wallet_address = ${wallet}
    RETURNING *
  `;
  const [withdrawal] = await sql`
    INSERT INTO withdrawals (project_id, wallet_address, amount, token, status, nonce, signature)
    VALUES (${projectId}, ${wallet}, ${amount}, 'USDC', 'processing', ${nonce}, 'e2e-test')
    RETURNING id
  `;
  console.log(`DB lock: withdrawal #${withdrawal.id}, new balance: ${newBalance}`);

  // Phase 2: On-chain controller.withdraw
  const controllerABI = parseAbi(["function withdraw(address to, uint256 amount) external"]);
  const data = encodeFunctionData({
    abi: controllerABI,
    functionName: "withdraw",
    args: [wallet, BigInt(Math.round(amountNum * 1_000_000))],
  });

  const gas = await publicClient.estimateGas({
    account: adminAccount,
    to: ENV.CONTROLLER,
    data,
  });
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
  console.log(`Withdraw tx sent: ${txHash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`Confirmed in block ${receipt.blockNumber}`);

  // Phase 3: Settle DB
  if (receipt.status === "success") {
    await sql`
      UPDATE withdrawals
      SET status = 'completed', tx_hash = ${txHash}, processed_at = NOW()
      WHERE id = ${withdrawal.id}
    `;
    console.log("✅ Withdraw completed in DB");
  } else {
    await sql`
      UPDATE user_balances
      SET usdc_balance = ${user.usdc_balance}::DECIMAL(18,6), nonce = ${nonce}
      WHERE wallet_address = ${wallet}
    `;
    await sql`
      UPDATE withdrawals
      SET status = 'failed', error = 'tx_reverted', processed_at = NOW()
      WHERE id = ${withdrawal.id}
    `;
    console.log("❌ Withdraw reverted, balance rolled back");
    return { ok: false, error: "tx_reverted" };
  }

  // Verify
  const stateAfter = await getControllerState();
  console.log(`Controller after: ${Number(stateAfter.balance) / 1e6} USDC, spent: ${Number(stateAfter.spent) / 1e6}`);

  const finalUser = (await sql`
    SELECT * FROM user_balances WHERE wallet_address = ${wallet}
  `)[0];
  console.log(`User balance: ${finalUser.usdc_balance} USDC, nonce: ${finalUser.nonce}`);

  return { ok: true, txHash };
}

if (process.argv[1] === import.meta.url) {
  run().then(console.log).catch(console.error);
}
