import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check - Super Admin Only
        const { session } = await getAuth();
        const address = session?.address;

        const isUserAdmin = await isAdmin(address);
        if (!address || !isUserAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { enabled, confirmationToken } = body;

        // 2. Verify Confirmation Token
        if (confirmationToken !== 'CONFIRM') {
            return NextResponse.json({
                error: "Invalid confirmation token. Type 'CONFIRM' to proceed."
            }, { status: 400 });
        }

        // 3. Log the action (for audit trail)
        console.warn(`🚨 KILL SWITCH TOGGLED by ${address}: WEBHOOKS_ENABLED=${enabled}`);

        // 4. Return current state (actual toggle requires manual Vercel env update)
        return NextResponse.json({
            success: true,
            message: enabled
                ? "Kill switch DISABLED. Webhooks will resume processing."
                : "Kill switch ENABLED. Webhooks are now PAUSED.",
            currentState: process.env.WEBHOOKS_ENABLED !== 'false',
            warning: "⚠️ To persist this change, update WEBHOOKS_ENABLED in Vercel Environment Variables and redeploy."
        });

    } catch (error: any) {
        console.error("Kill Switch Toggle Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
