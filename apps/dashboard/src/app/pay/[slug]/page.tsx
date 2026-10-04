import { notFound } from "next/navigation";
import { db } from "@saasfly/db-core";
import { paymentLinks, clients } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { PaymentCheckout } from "@/components/payments/PaymentCheckout";

// Add metadata later
export default async function PaymentPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug: id } = await params;

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
