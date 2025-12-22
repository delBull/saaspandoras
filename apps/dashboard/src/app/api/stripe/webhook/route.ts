import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { activateClient } from "@/lib/project-utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-04-10" as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    if (!endpointSecret) {
        return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
    }

    const body = await req.text();
    const headersList = await headers();
    const sig = headersList.get("stripe-signature");

    let event: Stripe.Event;

    try {
        if (!sig) throw new Error("No signature");
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`⚠️  Webhook signature verification failed.`, err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log(`💰 Payment succeeded for session ID: ${session.id}`);

            // Retrieve metadata
            const { clientId, linkId, projectTitle } = session.metadata || {};

            if (clientId) {
                try {
                    // 1. Legacy Activation (Optional, if still needed for marketing OS)
                    await activateClient(
                        Number(clientId),
                        'stripe_card',
                        (session.amount_total ? session.amount_total / 100 : 0).toString() + ' USD'
                    );

                    // 2. Register Transaction in Dashboard DB
                    const { db } = await import("@/db");
                    const { transactions } = await import("@/db/schema");

                    await db.insert(transactions).values({
                        linkId: linkId || undefined,
                        clientId: clientId.toString(),
                        amount: (session.amount_total ? session.amount_total / 100 : 0).toString(),
                        currency: session.currency?.toUpperCase() || 'USD',
                        method: 'stripe',
                        status: 'completed',
                        processedAt: new Date(),
                    });

                    // 3. Send Discord Notification
                    const { sendPaymentNotification } = await import("@/lib/discord/notifier");
                    await sendPaymentNotification({
                        type: "payment_received",
                        amount: session.amount_total ? session.amount_total / 100 : 0,
                        currency: session.currency?.toUpperCase() || "USD",
                        method: "stripe",
                        status: "completed",
                        linkId: linkId,
                        clientId: clientId,
                        metadata: {
                            stripeSessionId: session.id,
                            customerEmail: session.customer_details?.email
                        }
                    });

                } catch (e) {
                    console.error("Failed to process Stripe webhook:", e);
                }
            } else {
                console.warn("⚠️ No clientId in metadata");
            }
            break;
        }
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
