import { db } from '@/db';
import { operationalIntents } from '@/db/schema';
async function run() {
  try {
    const intentId = `intent_full_access_auto_${Date.now()}`;
    await db.insert(operationalIntents).values({
      id: intentId,
      organizationId: '9079ecf5-2162-4078-bddf-66b607e2d32f',
      missionId: 'admin_full_access_mission',
      packId: 'core_admin_pack',
      packVersion: '1.0.0',
      strategyDecisionId: 'decision_full_access_v1',
      intentType: 'admin.full_access.v1',
      objective: 'Full-access provisioning (no-charge) for tenant snarai',
      rationale: 'Direct auto-approval by SUPER_ADMIN (marco@pandoras.finance).',
      status: 'executed',
    });
    console.log("Success");
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
