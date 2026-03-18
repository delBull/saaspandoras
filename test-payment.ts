process.env.NODE_ENV = 'production';
import { db } from './apps/dashboard/src/db';
import { clients, paymentLinks, transactions } from './apps/dashboard/src/db/schema';
import { eq } from 'drizzle-orm';
import { updatePaymentStatus } from './apps/dashboard/src/actions/clients';

async function testUpdatePayment() {
    console.log("Fetching a payment link to test...");
    const link = await db.query.paymentLinks.findFirst() as any;
    if (!link) {
        console.log("No payment links found to test.");
        process.exit(0);
    }
    
    console.log(`Found link: ${link.id}`);
    console.log(`Testing updatePaymentStatus...`);
    
    try {
        const result = await updatePaymentStatus(link.id, 'paid');
        console.log("Result:", result);
    } catch (e) {
        console.error("Exception caught:", e);
    }
    process.exit(0);
}

testUpdatePayment();
