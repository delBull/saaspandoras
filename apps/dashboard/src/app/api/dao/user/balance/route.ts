import { NextResponse } from "next/server";
import { db } from "~/db";
import { userBalances } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
        return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    try {
        const balance = await db.query.userBalances.findFirst({
            where: eq(userBalances.walletAddress, address)
        });

        if (!balance) {
            return NextResponse.json({ balance: "0", pbox: "0" });
        }

        return NextResponse.json({
            balance: balance.pboxBalance, // Legacy unified field if needed
            pbox: balance.pboxBalance,
            usdc: balance.usdcBalance,
            eth: balance.ethBalance
        });
    } catch (error) {
        console.error("Balance Fetch Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
