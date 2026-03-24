import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

/**
 * 🧬 Access Classification Service (Genesis Strategy)
 * ============================================================================
 * Categorizes users into "Genesis" or "Standard" tiers based on when they 
 * first joined (user.createdAt) relative to the launch window.
 * 
 * Logic ensures:
 * 1. Idempotency: Users are classified only once (Atomic Update).
 * 2. Early Intent Protection: If a user joined early but logs in late, 
 *    they still receive Genesis status.
 * 3. Security: Classification requires walletVerified=true.
 * ============================================================================
 */
export async function classifyUserAccess(userId: string) {
  // 1. Fetch User (Initial Reference)
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) throw new Error("User not found");

  // 🛡️ Audit Fix: Identity Integrity
  if (!user.walletVerified) {
    console.warn(`🧬 [ACCESS] Blocked classification for user ${userId}: Wallet not verified`);
    throw new Error("Verified wallet required for access release");
  }

  // Idempotency: Fast-path if already exists
  if (user.accessGrantedAt) {
    return { 
      benefitsTier: user.benefitsTier, 
      accessCohort: user.accessCohort,
      alreadyClassified: true 
    };
  }

  // 2. Classification Core: Explicit Robustness
  const LAUNCH_TIME = process.env.NEXT_PUBLIC_LAUNCH_TIME 
    ? new Date(process.env.NEXT_PUBLIC_LAUNCH_TIME).getTime()
    : new Date("2026-03-24T00:00:00Z").getTime();

  const BETA_WINDOW = 1000 * 60 * 60 * 72; // 72 Hours Window
  const referenceTime = user.createdAt.getTime();
  
  const isEarly = referenceTime <= LAUNCH_TIME || 
                  (referenceTime > LAUNCH_TIME && (referenceTime - LAUNCH_TIME) < BETA_WINDOW);

  const benefitsTier = isEarly ? "genesis" : "standard";
  const accessCohort = isEarly ? "beta" : "public";

  // 3. ATOMIC DB UPDATE (Audit Fix: Race Condition Protection)
  // We only update if accessGrantedAt is STILL null.
  const results = await db.update(users)
    .set({
      benefitsTier,
      accessCohort,
      accessGrantedAt: new Date(),
    })
    .where(
      and(
        eq(users.id, userId),
        isNull(users.accessGrantedAt)
      )
    )
    .returning();

  const updatedUser = results[0];
  const wasUpdatedByThisCall = !!updatedUser;

  console.log(`🧬 [ACCESS] Classification result for user ${userId}: Updated=${wasUpdatedByThisCall}, Tier=${benefitsTier}`);

  return { 
    benefitsTier: wasUpdatedByThisCall ? benefitsTier : (((updatedUser as any)?.benefitsTier) || user.benefitsTier), 
    accessCohort: wasUpdatedByThisCall ? accessCohort : (((updatedUser as any)?.accessCohort) || user.accessCohort), 
    alreadyClassified: !wasUpdatedByThisCall,
    referenceDate: user.createdAt
  };
}
