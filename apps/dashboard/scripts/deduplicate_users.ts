import { db } from '@saasfly/db-core';
import {
  users,
  purchases,
  userBalances,
  userIdentities,
  userPoints,
  userRewards,
  userAchievements,
  userReferrals,
  verifiedIdentities,
  marketingLeads,
} from '@saasfly/db-core/schema';
import { eq } from "@saasfly/db-core";

/**
 * Deduplicate Users by Email.
 * Preference logic:
 * 1. Record with a walletAddress.
 * 2. Record with hasPandorasKey = true.
 * 3. Record with telegramId.
 * 4. Oldest record (by createdAt or id).
 */
async function deduplicateUsers() {
  console.log('--- Starting User Deduplication ---');

  // 1. Fetch all users
  const allUsers = await db.query.users.findMany();
  console.log(`Found ${allUsers.length} total users.`);

  // 2. Group by email
  const byEmail = new Map<string, typeof allUsers>();
  for (const user of allUsers) {
    if (!user.email) continue;
    const email = user.email.toLowerCase().trim();
    const group = byEmail.get(email) || [];
    group.push(user);
    byEmail.set(email, group);
  }

  // 3. Find duplicates
  const duplicates = Array.from(byEmail.entries()).filter(([_, group]) => group.length > 1);
  console.log(`Found ${duplicates.length} duplicate emails to resolve.`);

  let resolvedCount = 0;
  for (const [email, group] of duplicates) {
    console.log(`\nResolving duplicates for: ${email} (${group.length} records)`);

    // Sort to determine canonical
    const sorted = group.sort((a, b) => {
      // Rule 1: Wallet Address
      if (a.walletAddress && !b.walletAddress) return -1;
      if (!a.walletAddress && b.walletAddress) return 1;

      // Rule 2: Pandora's Key
      if (a.hasPandorasKey && !b.hasPandorasKey) return -1;
      if (!a.hasPandorasKey && b.hasPandorasKey) return 1;

      // Rule 3: Telegram ID
      if (a.telegramId && !b.telegramId) return -1;
      if (!a.telegramId && b.telegramId) return 1;

      // Rule 4: ID comparison (fallback to older string sorting)
      return a.id.localeCompare(b.id);
    });

    const canonical = sorted[0];
    if (!canonical) continue;
    const duplicatesToRemove = sorted.slice(1);

    console.log(`  Canonical selected: ${canonical.id} (Wallet: ${canonical.walletAddress || 'none'})`);

    // Migrate references for each duplicate to canonical
    for (const dup of duplicatesToRemove) {
      console.log(`  Migrating references from duplicate: ${dup.id} ...`);
      
      try {
        // Update references keyed by userId
        await db.update(purchases).set({ userId: canonical.id }).where(eq(purchases.userId, dup.id));
        await db.update(userIdentities).set({ userId: canonical.id }).where(eq(userIdentities.userId, dup.id));
        await db.update(userPoints).set({ userId: canonical.id }).where(eq(userPoints.userId, dup.id));
        await db.update(userRewards).set({ userId: canonical.id }).where(eq(userRewards.userId, dup.id));
        await db.update(userAchievements).set({ userId: canonical.id }).where(eq(userAchievements.userId, dup.id));
        await db.update(verifiedIdentities).set({ userId: canonical.id }).where(eq(verifiedIdentities.userId, dup.id));
        await db.update(marketingLeads).set({ userId: canonical.id }).where(eq(marketingLeads.userId, dup.id));

        // If duplicate has a wallet address and canonical has one, merge balances
        if (dup.walletAddress && canonical.walletAddress && dup.walletAddress !== canonical.walletAddress) {
          const dupBalance = await db.query.userBalances.findFirst({
            where: eq(userBalances.walletAddress, dup.walletAddress)
          });
          const canonicalBalance = await db.query.userBalances.findFirst({
            where: eq(userBalances.walletAddress, canonical.walletAddress)
          });

          if (dupBalance) {
             if (canonicalBalance) {
                // Merge balances explicitly to preserve monetary state
                await db.update(userBalances).set({
                   pboxBalance: (parseFloat(canonicalBalance.pboxBalance) + parseFloat(dupBalance.pboxBalance)).toString(),
                   usdcBalance: (parseFloat(canonicalBalance.usdcBalance) + parseFloat(dupBalance.usdcBalance)).toString(),
                   ethBalance: (parseFloat(canonicalBalance.ethBalance) + parseFloat(dupBalance.ethBalance)).toString(),
                }).where(eq(userBalances.walletAddress, canonical.walletAddress));
                // Delete duplicate balance
                await db.delete(userBalances).where(eq(userBalances.walletAddress, dup.walletAddress));
             } else {
                // Just update the wallet address of the balance to the canonical one
                await db.update(userBalances).set({ walletAddress: canonical.walletAddress }).where(eq(userBalances.walletAddress, dup.walletAddress));
             }
          }

          // Update referrals keyed by wallet address
          await db.update(userReferrals).set({ referrerWalletAddress: canonical.walletAddress }).where(eq(userReferrals.referrerWalletAddress, dup.walletAddress));
          await db.update(userReferrals).set({ referredWalletAddress: canonical.walletAddress }).where(eq(userReferrals.referredWalletAddress, dup.walletAddress));
        }
        
        // Delete the duplicate record
        await db.delete(users).where(eq(users.id, dup.id));
        console.log(`  Deleted duplicate: ${dup.id}`);
      } catch (err) {
        console.error(`  Failed to migrate duplicate ${dup.id}:`, err);
        throw err; // Fail fast and loudly, no silent catches
      }
    }

    resolvedCount++;
  }

  console.log(`\n--- Deduplication Complete ---`);
  console.log(`Resolved ${resolvedCount} emails.`);
}

deduplicateUsers().catch((err) => {
  console.error("Fatal error during deduplication:", err);
  process.exit(1);
});
