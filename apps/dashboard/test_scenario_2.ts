import { recordCallOutcome } from './src/actions/growth-os';
import { db } from './src/db';
import { marketingLeads } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function simulate() {
  const TEST_EMAIL = "intent_test_elite@example.com";
  console.log(`🚀 Simulating High Intent Flow for ${TEST_EMAIL}...`);

  // 1. Ensure lead exists (or create it)
  let lead = await db.query.marketingLeads.findFirst({
    where: eq(marketingLeads.email, TEST_EMAIL)
  });

  if (!lead) {
    console.log("Lead not found, skipping (should be created by event burst)...");
    return;
  }

  // 2. Trigger HOT outcome
  console.log(`🔥 Recording HOT outcome for Lead ID: ${lead.id}`);
  await recordCallOutcome(lead.id, 'hot', 5000, 70); // 5k deal, 70% prob

  console.log("✅ Scenario 2 Execution Done.");
}

simulate().catch(console.error).finally(() => process.exit(0));
