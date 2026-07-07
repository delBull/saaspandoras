import { db } from './apps/dashboard/src/db/index.js';
import { ambassadors } from './apps/dashboard/src/db/schema.js';

async function test() {
  try {
    const [newAmbassador] = await db.insert(ambassadors).values({
      fullName: 'Test User',
      email: 'test@example.com',
      phone: null,
      socialUrl: null,
      walletAddress: null,
      referralCode: 'TEST-123',
      origin: 'snarai' as any,
      projectId: 2,
      status: 'pending',
      emailVerified: false,
      verificationToken: '123456'
    }).returning();
    console.log('Success:', newAmbassador);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
