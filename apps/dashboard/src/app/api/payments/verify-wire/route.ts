import { NextResponse } from 'next/server';
import { db } from "@/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("⚠️ [MANUAL_VERIFY_PAYMENT] Wire Transfer Reported:", body);

        // TODO: Implement actual DB logging or Discord notification here.
        // For now, we log to stdout so it appears in logs.

        return NextResponse.json({ success: true, message: "Logged" });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
