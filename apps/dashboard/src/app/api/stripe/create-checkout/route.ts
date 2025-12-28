import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-04-10" as any, // Use latest or pinned version
});

export async function POST(req: Request) {
    try {
        const { linkId, clientId, amount, title, clientEmail } = await req.json();

        // Validate basic data
        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: title || "Pandora's Service",
                            description: `Payment for Link #${linkId}`,
                        },
                        unit_amount: Math.round(Number(amount) * 100), // Amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${linkId}?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${linkId}?canceled=true`,
            customer_email: clientEmail,
            metadata: {
                linkId: linkId.toString(),
                clientId: clientId?.toString(),
                projectTitle: title,
                type: "tier_1_payment"
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }
}
