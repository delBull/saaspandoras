import { formatUnits, parseUnits, encodeFunctionData } from "viem";
import { ENV } from "./config.mjs";
import { publicClient, adminAccount, getUsdcBalance, getControllerState, USDC_ABI } from "./chain.mjs";
import { getSql } from "./db.mjs";

export async function run() {
  console.log("\n=== Phase A: Setup ===");
  const sql = getSql();

  // Create tables if missing
  await sql`
    CREATE TABLE IF NOT EXISTS dao_rewards (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL,
      wallet_address VARCHAR(42) NOT NULL,
      amount DECIMAL(18,6) NOT NULL,
      token VARCHAR(20) DEFAULT 'USDC' NOT NULL,
      reason TEXT NOT NULL,
      claim_batch_id INTEGER,
      claimed_at TIMESTAMP,
      tx_hash VARCHAR(66),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  console.log("  Tables ready");

  // Ensure test project exists
  const project = await sql`
    SELECT id, applicant_wallet_address FROM projects WHERE id = ${ENV.PROJECT_ID}
  `;
  if (project.length === 0) {
    console.log(`  Project ${ENV.PROJECT_ID} not found — create it first`);
    return { ok: false, error: "project_not_found" };
  }
  console.log(`  Project: ${project[0].id}, owner: ${project[0].applicant_wallet_address}`);

  // Ensure dao_members exist
  const members = await sql`
    SELECT * FROM dao_members WHERE project_id = ${ENV.PROJECT_ID}
  `;
  if (members.length === 0) {
    console.log("  No DAO members found — seeding...");
    await sql`
      INSERT INTO dao_members (project_id, wallet, voting_power, created_at)
      VALUES
        (${ENV.PROJECT_ID}, ${ENV.TEST_USER1.toLowerCase()}, 60, NOW()),
        (${ENV.PROJECT_ID}, ${ENV.TEST_USER2.toLowerCase()}, 40, NOW())
    `;
    console.log("  2 DAO members created (60/40 split)");
  } else {
    console.log(`  ${members.length} DAO members exist`);
  }

  // Ensure user_balances for test users
  for (const wallet of [ENV.TEST_USER1, ENV.TEST_USER2]) {
    const w = wallet.toLowerCase();
    const existing = await sql`
      SELECT * FROM user_balances WHERE wallet_address = ${w}
    `;
    if (existing.length === 0) {
      await sql`
        INSERT INTO user_balances (wallet_address, usdc_balance, pbox_balance, nonce)
        VALUES (${w}, 0.000000, 0.00, 0)
      `;
    }
  }
  console.log("  user_balances ready");

  // Check admin's USDC balance (needs to be controller's owner, not just owner of USDC)
  const adminUsdcBal = await getUsdcBalance(adminAccount.address);
  console.log(`  Admin USDC: ${formatUnits(adminUsdcBal, 6)}`);

  // Approve controller to spend USDC
  const currentAllowance = await publicClient.readContract({
    address: ENV.USDC,
    abi: USDC_ABI,
    functionName: "allowance",
    args: [adminAccount.address, ENV.CONTROLLER],
  });
  console.log(`  Current allowance: ${formatUnits(currentAllowance, 6)} USDC`);
  if (currentAllowance < 100_000_000n) {
    console.log("  Approving controller for 100000 USDC...");
    const nonce = await publicClient.getTransactionCount({ address: adminAccount.address });
    const fee = await publicClient.estimateFeesPerGas();
    const data = encodeFunctionData({
      abi: USDC_ABI,
      functionName: "approve",
      args: [ENV.CONTROLLER, parseUnits("100000", 6)],
    });
    const gas = await publicClient.estimateGas({ account: adminAccount, to: ENV.USDC, data });
    const signedTx = await adminAccount.signTransaction({
      to: ENV.USDC, data, gas,
      maxFeePerGas: fee.maxFeePerGas, maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
      nonce, chainId: 11155111n,
    });
    const txHash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx });
    console.log(`  Approval tx: ${txHash}`);
    await publicClient.waitForTransactionReceipt({ hash: txHash });
    const newAllowance = await publicClient.readContract({
      address: ENV.USDC,
      abi: USDC_ABI,
      functionName: "allowance",
      args: [adminAccount.address, ENV.CONTROLLER],
    });
    console.log(`  New allowance: ${formatUnits(newAllowance, 6)} USDC`);
  }

  // Check ETH balance
  const ethBal = await publicClient.getBalance({ address: adminAccount.address });
  console.log(`  Admin ETH: ${formatUnits(ethBal, 18)}`);

  // Check controller state
  const state = await getControllerState();
  console.log(`  Controller USDC: ${formatUnits(state.balance, 6)}`);
  console.log(`  Daily limit: ${formatUnits(state.limit, 6)} USDC`);
  console.log(`  Remaining: ${formatUnits(state.remaining, 6)} USDC`);

  if (adminUsdcBal < 10_000_000n) {
    console.log(`  ⚠️  Admin USDC low — top-up skipped for E2E`);
  }

  if (state.balance > 0n) {
    console.log("✅ Setup complete (USDC in controller)");
    return { ok: true };
  } else {
    console.log("⚠️  Controller has 0 USDC — will use mock rewards for E2E");
    return { ok: true, skipped: true, reason: "no_controller_usdc" };
  }
}

if (process.argv[1] === import.meta.url) {
  run().then(console.log).catch(console.error);
}
