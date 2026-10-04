import { db } from '@saasfly/db-core';
import { portalOnboardingState } from '@saasfly/db-core/schema';
import { eq } from "@saasfly/db-core";

async function main() {
  await db.delete(portalOnboardingState).where(eq(portalOnboardingState.tenantId, 'snarai'));
  console.log("✅ SNarai onboarding state cleared");
  process.exit(0);
}

main().catch(console.error);
