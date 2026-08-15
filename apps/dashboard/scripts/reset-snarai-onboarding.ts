import { db } from '../src/db';
import { portalOnboardingState } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  await db.delete(portalOnboardingState).where(eq(portalOnboardingState.tenantId, 'snarai'));
  console.log("✅ SNarai onboarding state cleared");
  process.exit(0);
}

main().catch(console.error);
