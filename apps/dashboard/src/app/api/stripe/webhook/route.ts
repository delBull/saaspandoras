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
                // Determine Project ID (in a real app, Client might be different from Project, 
                // but assuming 1:1 or we look up Project by Client ID for this flow)
                // For now, let's assume 'clientId' corresponds to 'projectId' in our logic if passed that way,
                // OR we strictly passed 'projectId' in metadata if available.
                // In PaymentCheckout.tsx we passed `clientData?.id`. 
                // If `clientData` is `projects` row, then it's projectId.

                try {
                    await activateClient(
                        Number(clientId),
                        'stripe_card',
                        (session.amount_total ? session.amount_total / 100 : 0).toString() + ' USD'
                    );
                } catch (e) {
                    console.error("Failed to activate client from webhook:", e);
                    // Don't return 500 here to avoid retrying indefinitely if it's a logic error,
                    // but do log it.
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
