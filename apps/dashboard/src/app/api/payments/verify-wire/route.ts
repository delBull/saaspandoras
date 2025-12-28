import { NextResponse } from 'next/server';
import { db } from "@/db";
import { updatePaymentStatus } from "@/actions/clients";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("⚠️ [MANUAL_VERIFY_PAYMENT] Wire Transfer Reported:", body);

        // Record Pending Transaction
        // Record Pending Transaction via Action
        const res = await updatePaymentStatus(body.linkId, 'pending', 'wire');

        if (!res.success) throw new Error(res.error);

        // Notify Admins
        const { sendPaymentNotification } = await import("@/lib/discord/notifier");
        await sendPaymentNotification({
            type: "payment_received",
            amount: Number(body.amount),
            currency: "USD",
            method: "wire",
            status: "pending",
            linkId: body.linkId,
            clientId: body.clientId,
            metadata: {
                manual: true,
                message: "Wire Transfer Reported - Requires Verification"
            }
        });

        return NextResponse.json({ success: true, message: "Logged and Pending" });
    } catch (error) {
        console.error("Wire Verify Error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
