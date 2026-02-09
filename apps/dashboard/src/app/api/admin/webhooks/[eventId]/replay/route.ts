import { NextRequest, NextResponse } from "next/server";
import { WebhookProcessor } from "@/lib/integrations/webhook-processor";
import { getAuth, isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
    try {
        // 1. Admin/Security Check
        const { session } = await getAuth();
        const address = session?.address;

        const isUserAdmin = await isAdmin(address);

        if (!address || !isUserAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const eventId = params.eventId;

        // 2. Validate Event Exists & is Failed
        const event = await db.query.webhookEvents.findFirst({
            where: eq(webhookEvents.id, eventId)
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (event.status !== 'failed') {
            return NextResponse.json({ error: "Event is not in failed state" }, { status: 400 });
        }

        // 3. Trigger Replay
        await WebhookProcessor.retryEvent(eventId);

        return NextResponse.json({ success: true, message: "Event queued for retry" });

    } catch (error: any) {
        console.error("Replay Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
