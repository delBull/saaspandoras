import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { WebhookProcessor } from "@/lib/integrations/webhook-processor";

export const dynamic = 'force-dynamic'; // Ensure it runs every time

export async function GET(req: NextRequest) {
    try {
        // Optional: Secure with CRON_SECRET if desired
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await WebhookProcessor.processPendingEvents(50); // Process batch of 50

        return NextResponse.json({ success: true, message: "Webhook processing triggered" });
    } catch (error: any) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
