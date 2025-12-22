
import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { sendPaymentNotification } from "@/lib/discord/notifier";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Thirdweb Webhook Payload Structure Check
        // Usually contains 'type', 'chainId', 'logs' or 'event'
        // Simplified handling for 'Transfer' event

        console.log("🕸️ [THIRDWEB_WEBHOOK]", JSON.stringify(body, null, 2));

        // Example Payload logic (Generic for now as structures vary by webhook type configured)
        // Adjust based on specific event "Tokens Sent" or "Contract Event"
        const eventType = body.type || "unknown";

        // If it's a test ping
        if (eventType === "TEST_NOTIFICATION") {
            return NextResponse.json({ status: "ok" });
        }

        // We assume the user set up a "Contract Event" listener for "Transfer" on USDC
        // or a "Wallet Activity" webhook.

        // Attempt to extract useful info
        // This is highly dependent on how the user configures the webhook in dashboard.
        // We will log generic info and notify Discord about "Activity Detected"

        const txHash = body.transactionHash || body.hash || "unknown";
        const fromAddress = body.fromAddress || body.from || "unknown";
        const toAddress = body.toAddress || body.to || "unknown";
        const value = body.value || body.amount || "0";

        // Record in DB as Unassigned Transaction
        await db.insert(transactions).values({
            amount: value.toString(),
            currency: 'CRYPTO', // We might not know exact token symbol without more config
            method: 'crypto',
            status: 'completed',
            processedAt: new Date(),
            // linkId and clientId are unknown, Admins must reconcile
        });

        // Notify Discord
        await sendPaymentNotification({
            type: "payment_received",
            amount: Number(value),
            currency: "CRYPTO (Webhook)",
            method: "crypto",
            status: "completed",
            metadata: {
                message: "Crypto activity detected via Webhook. Please match with Payment Link.",
                from: fromAddress,
                to: toAddress,
                txHash: txHash
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Thirdweb Webhook Error:", error);
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
}
