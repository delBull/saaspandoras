import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { marketingLeads } from './src/db/schema';

async function main() {
  const client = postgres('postgresql://neondb_owner:npg_IZJDPG21sLkC@ep-muddy-mud-ad6mipow-pooler.c-2.us-east-1.aws.neon.tech/neondb', { ssl: 'require' });
  const db = drizzle(client);

  try {
    const baseLeadData = {
      userId: null,
      projectId: 12,
      email: "marco.munoz9@gmail.com",
      name: "Early Access User",
      phoneNumber: null,
      walletAddress: "0x96631D6c5295F1f08334888C5D6f3a246fa9C3bA",
      fingerprint: null,
      identityHash: "492422e42ddeed5d90fc2e66d5f1ea01b0f3598b628837dce59f6bb6d9221133",
      origin: null,
      intent: 'explore' as any,
      consent: true,
      metadata: {},
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
      
    console.log("SUCCESS:", result);
  } catch(e) {
    console.error("ERROR:", e);
  } finally {
    await client.end();
  }
}

main();
