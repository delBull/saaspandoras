import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { marketingLeads, marketingLeadEvents, marketingLeadAttributions } from './src/db/schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
  const client = postgres('postgresql://neondb_owner:npg_IZJDPG21sLkC@ep-muddy-mud-ad6mipow-pooler.c-2.us-east-1.aws.neon.tech/neondb', { ssl: 'require' });
  const db = drizzle(client);

  const MODE: string = 'CLEANUP'; // Set to 'CLEANUP' to clear data
  const TARGET_PROJECT_ID = 12;

  try {
    if (MODE === 'CLEANUP') {
      console.log(`🧹 Starting Deep Cleanup for Project ID: ${TARGET_PROJECT_ID}`);
      
      const attDeleted = await db.delete(marketingLeadAttributions).where(eq(marketingLeadAttributions.projectId, TARGET_PROJECT_ID));
      console.log(`- Deleted attributions`);

      // Delete events for leads of this project
      const leads = await db.select({ id: marketingLeads.id }).from(marketingLeads).where(eq(marketingLeads.projectId, TARGET_PROJECT_ID));
      const leadIds = leads.map(l => l.id);
      
      if (leadIds.length > 0) {
        // We delete by batches or simple in if small
        await db.delete(marketingLeadEvents).where(sql`lead_id IN (${sql.join(leadIds, sql`, `)})`);
        console.log(`- Deleted ${leadIds.length} lead events`);
      }

      const leadsDeleted = await db.delete(marketingLeads).where(eq(marketingLeads.projectId, TARGET_PROJECT_ID));
      console.log(`- Deleted marketing leads`);
      
      console.log("✅ Cleanup Finished.");
      return;
    }

    // --- TEST MODE ---
    const baseLeadData = {
      userId: null,
      projectId: TARGET_PROJECT_ID,
      email: "marco.munoz9@gmail.com",
      name: "Early Access User",
      phoneNumber: null,
      walletAddress: "0x96631D6c5295F1f08334888C5D6f3a246fa9C3bA",
      fingerprint: null,
      identityHash: "492422e42ddeed5d90fc2e66d5f1ea01b0f3598b628837dce59f6bb6d9221133",
      origin: "https://staging.pandoras.finance",
      intent: 'explore' as any,
      consent: true,
      metadata: { growth: { state: 'NEW', updatedAt: Date.now(), history: [], executedActions: {} } },
      status: 'active' as any,
      score: 65,
      updatedAt: new Date(),
    };

    const [result] = await db.insert(marketingLeads)
      .values({
        ...baseLeadData,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [marketingLeads.projectId, marketingLeads.email],
        set: baseLeadData
      })
      .returning();
      
    console.log("🚀 TEST SUCCESS:", result);
  } catch(e) {
    console.error("❌ ERROR:", e);
  } finally {
    await client.end();
  }
}

main();
