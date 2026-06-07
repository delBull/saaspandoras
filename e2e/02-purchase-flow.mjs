import { ENV } from "./config.mjs";
import { getSql } from "./db.mjs";

export async function run() {
  console.log("\n=== Phase B: Fundraising / Captación (Simulated) ===");
  const sql = getSql();
  const wallet = ENV.TEST_USER1.toLowerCase();

  // Simulate user depositing USDC by crediting user_balances
  const existing = await sql`
    SELECT * FROM user_balances WHERE wallet_address = ${wallet}
  `;
  if (existing.length === 0) {
    await sql`
      INSERT INTO user_balances (wallet_address, usdc_balance, pbox_balance, nonce)
      VALUES (${wallet}, 50.000000, 0.00, 0)
    `;
    console.log(`  ${wallet}: seeded with 50 USDC`);
  } else {
    const bal = parseFloat(existing[0].usdc_balance);
    if (bal < 10) {
      await sql`
        UPDATE user_balances SET usdc_balance = 50.000000 WHERE wallet_address = ${wallet}
      `;
      console.log(`  ${wallet}: topped up to 50 USDC`);
    } else {
      console.log(`  ${wallet}: balance = ${bal} USDC (ok)`);
    }
  }

  // Simulate another user
  const wallet2 = ENV.TEST_USER2.toLowerCase();
  const existing2 = await sql`
    SELECT * FROM user_balances WHERE wallet_address = ${wallet2}
  `;
  if (existing2.length === 0) {
    await sql`
      INSERT INTO user_balances (wallet_address, usdc_balance, pbox_balance, nonce)
      VALUES (${wallet2}, 30.000000, 0.00, 0)
    `;
  } else {
    const bal2 = parseFloat(existing2[0].usdc_balance);
    if (bal2 < 5) {
      await sql`
        UPDATE user_balances SET usdc_balance = 30.000000 WHERE wallet_address = ${wallet2}
      `;
    }
  }

  console.log("✅ Captación completed (simulated USDC deposits)");
  return { ok: true };
}

if (process.argv[1] === import.meta.url) {
  run().then(console.log).catch(console.error);
}
