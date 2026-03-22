
import { db } from './src/db';
import { marketingLeads } from './src/db/schema';

async function main() {
  try {
    console.log("Starting verification...");
    const res = await db.insert(marketingLeads).values({
      projectId: 12,
      email: 'test-antigravity-v3@narai.com',
      name: 'Antigravity Test V3',
      status: 'active',
      intent: 'invest',
      score: 95,
      origin: 'https://narai.market'
    }).returning();
    
    if (res && res[0]) {
      console.log('✅ Lead inserted with ID:', res[0].id);
    } else {
      console.log('⚠️ Insert succeeded but no ID returned');
    }
  } catch (e) {
    console.error('❌ Insert failed:', e);
  } finally {
    process.exit(0);
  }
}

main();
