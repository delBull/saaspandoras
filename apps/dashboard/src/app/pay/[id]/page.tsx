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
    });

    if (!link?.isActive) {
        return notFound();
    }

    // Manual client fetch
    const clientData = await db.query.clients.findFirst({
        where: eq(clients.id, link.clientId)
    });

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <PaymentCheckout link={link} client={clientData} />
        </div>
    );
}
