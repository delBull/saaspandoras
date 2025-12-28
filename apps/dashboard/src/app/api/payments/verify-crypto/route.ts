
import { NextResponse } from 'next/server';
import { updatePaymentStatus } from "@/actions/clients";
import { sendPaymentNotification } from "@/lib/discord/notifier";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("💰 [CRYPTO_PAYMENT] Verified client-side:", body);

        // Record Completed Transaction
        // Record Completed Transaction via Action
        const res = await updatePaymentStatus(body.linkId, 'paid', 'crypto');

        if (!res.success) throw new Error(res.error);

        // Notify
        await sendPaymentNotification({
            type: "payment_received",
            amount: Number(body.amount),
            currency: "USDC",
            method: "crypto",
            status: "completed",
            linkId: body.linkId,
            clientId: body.clientId,
            metadata: {
                txHash: body.txHash,
                chainId: body.chainId
            }
        });

        return NextResponse.json({ success: true, message: "Logged" });
    } catch (error) {
        console.error("Crypto Verify Error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
