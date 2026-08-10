import { NextResponse } from 'next/server';
import { db } from "@/db";
import { paymentLinks, transactions } from "@/db/schema";
import { eq } from 'drizzle-orm';
import { updatePaymentStatus } from "@/actions/clients";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { linkId } = body as { linkId?: string };

        if (!linkId) {
            return NextResponse.json({ success: false, error: "Missing linkId" }, { status: 400 });
        }

        // Validate the link exists before recording anything.
        const link = await db.query.paymentLinks.findFirst({
            where: eq(paymentLinks.id, linkId),
        });
        if (!link) {
            return NextResponse.json({ success: false, error: "Link not found" }, { status: 404 });
        }

        // Idempotency: if a pending wire transaction already exists for this link,
        // don't insert duplicates or re-notify admins.
        const existing = await db.query.transactions.findFirst({
            where: (t, { and, eq: e }) => and(e(t.linkId, linkId), e(t.method, 'wire'), e(t.status, 'pending')),
        });
        if (existing) {
            return NextResponse.json({ success: true, message: "Already pending", idempotent: true });
        }

        console.log("⚠️ [MANUAL_VERIFY_PAYMENT] Wire Transfer Reported:", body);

        // Record Pending Transaction
        // Note: wire only ever transitions to 'pending' here; admins confirm receipt
        // before a manual 'paid' transition elsewhere.
        const res = await updatePaymentStatus(linkId, 'pending', 'wire');

        if (!res.success) throw new Error(res.error);

        // Notify Admins
        const { sendPaymentNotification } = await import("@/lib/discord/notifier");
        await sendPaymentNotification({
            type: "payment_received",
            amount: Number(link.amount),
            currency: "USD",
            method: "wire",
            status: "pending",
            linkId: link.id,
            clientId: link.clientId,
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
