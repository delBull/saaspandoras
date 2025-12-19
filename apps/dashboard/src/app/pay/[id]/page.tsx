import { notFound } from "next/navigation";
import { db } from "@/db";
import { paymentLinks, clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PaymentCheckout } from "@/components/payments/PaymentCheckout";

// Add metadata later
export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch Link
    const link = await db.query.paymentLinks.findFirst({
        where: eq(paymentLinks.id, id),
        with: {
            client: true // Using the relation we define in schema or manually fetch if relation missing
        }
    });

    if (!link?.isActive) {
        return notFound();
    }

    // Manual client fetch if relation is not set up in drizzle relations
    let clientData = null;
    if (!link.client) {
        const c = await db.query.clients.findFirst({
            where: eq(clients.id, link.clientId)
        });
        clientData = c;
    } else {
        clientData = link.client;
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <PaymentCheckout link={link} client={clientData} />
        </div>
    );
}
