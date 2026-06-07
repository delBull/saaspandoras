#!/usr/bin/env node

async function run() {
  console.log("🧪 Pandora's E2E Suite — Safe + Allowance + Distribution + Claim\n");
  const results = [];

  const phases = [
    { name: "A: Setup", file: "./01-setup.mjs" },
    { name: "B: Captación (Fundraising)", file: "./02-purchase-flow.mjs" },
    { name: "C: Distribution → dao_rewards", file: "./03-distribution.mjs" },
    { name: "D: Claim Rewards (AllowanceController)", file: "./04-claim-rewards.mjs" },
  ];

  for (const phase of phases) {
    process.stdout.write(`\n──────────────────────────────\n`);
    process.stdout.write(`📌 ${phase.name}\n`);
    process.stdout.write(`──────────────────────────────\n`);

    try {
      const mod = await import(phase.file);
      const result = await mod.run();
      if (result.skipped) {
        results.push({ phase: phase.name, status: "⏭ SKIP", result });
      } else if (result.ok) {
        results.push({ phase: phase.name, status: "✅ PASS", result });
      } else {
        results.push({ phase: phase.name, status: "❌ FAIL", error: result.error || "unknown error" });
      }
    } catch (err) {
      results.push({ phase: phase.name, status: "❌ FAIL", error: err.message });
      console.error(`\n⚠️  ${phase.name} failed: ${err.message}`);
    }
  }

  console.log(`\n══════════════════════════════`);
  console.log(`📊 E2E Results`);
  console.log(`══════════════════════════════`);
  for (const r of results) {
    console.log(`  ${r.status}  ${r.phase}`);
    if (r.error) console.log(`       ${r.error}`);
    if (r.result?.distributed) console.log(`       Distributed: ${r.result.distributed.toFixed(2)} USDC`);
    if (r.result?.claimed && r.result.claimed.length) console.log(`       Claimed: ${r.result.claimed.length} wallets`);
    if (r.result?.spent) console.log(`       Spent: ${r.result.spent.toFixed(2)} USDC`);
  }
  let passed = 0;
  let skipped = 0;
  for (const r of results) {
    if (r.status === "✅ PASS" || (r.status === "⏭ SKIP" && r.result?.ok)) passed++;
    if (r.status === "⏭ SKIP") skipped++;
  }
  console.log(`\n✅ ${passed} passed${skipped > 0 ? ` (${skipped} skipped)` : ""}`);

  process.exit(results.length === passed ? 0 : 1);
}

run();