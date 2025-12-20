
import { NextResponse } from "next/server";
import { db } from "@/db";
import { marketingCampaigns } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, name, isActive, config } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        await db.update(marketingCampaigns)
            .set({
                name,
                isActive,
                config: config as any, // Cast to any for JSONB
                updatedAt: new Date()
            })
            .where(eq(marketingCampaigns.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating campaign:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
