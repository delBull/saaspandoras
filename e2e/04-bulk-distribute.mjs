import { ENV } from "./config.mjs";
import { getSql } from "./db.mjs";

export async function run() {
  console.log("\n=== Fase D: Bulk Distribution ===");

  const sql = getSql();
  const projectId = ENV.PROJECT_ID;

  // Get holders from withdrawals table for this project
  const holders = await sql`
    SELECT DISTINCT wallet_address FROM (
      SELECT wallet_address FROM withdrawals WHERE project_id = ${projectId}
      UNION
      SELECT wallet_address FROM dao_rewards WHERE project_id = ${projectId}
    ) AS holders
  `;

  let targetHolders = holders.map(h => h.wallet_address);

  if (targetHolders.length === 0) {
    targetHolders = [ENV.ADMIN.toLowerCase()];
  }

  console.log(`Found ${targetHolders.length} unique holders`);

  // Simulate a pro-rata distribution of 10 USDC
  const totalDistribute = 10;
  const perHolder = (totalDistribute / targetHolders.length).toFixed(6);
  console.log(`Distributing ${totalDistribute} USDC among ${targetHolders.length} holders (${perHolder} each)`);

  for (const wallet of targetHolders) {
    const existing = await sql`
      SELECT * FROM user_balances WHERE wallet_address = ${wallet}
    `;

    if (existing.length > 0) {
      const newBal = (parseFloat(existing[0].usdc_balance) + parseFloat(perHolder)).toFixed(6);
      await sql`
        UPDATE user_balances
        SET usdc_balance = ${newBal}::DECIMAL(18,6)
        WHERE wallet_address = ${wallet}
      `;
    } else {
      await sql`
        INSERT INTO user_balances (wallet_address, usdc_balance, pbox_balance, nonce)
        VALUES (${wallet}, ${perHolder}, 0.00, 0)
      `;
    }

    await sql`
      INSERT INTO dao_rewards (project_id, wallet_address, amount, token, reason)
      VALUES (${projectId}, ${wallet}, ${perHolder}, 'USDC', 'bulk_distribution_e2e')
    `;

    console.log(`  ${wallet}: +${perHolder} USDC`);
  }

  console.log("✅ Bulk distribution complete");
  return { ok: true, distributed: targetHolders.length };
}

if (process.argv[1] === import.meta.url) {
  run().then(console.log).catch(console.error);
}
