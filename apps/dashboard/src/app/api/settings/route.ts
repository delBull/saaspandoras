import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";

// Force dynamic for Next.js
export const dynamic = 'force-dynamic';

// GET: Retrieve all settings or a specific key
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    try {
        if (key) {
            const setting = await db.query.platformSettings.findFirst({
                where: eq(platformSettings.key, key),
            });
            return NextResponse.json(setting || { key, value: null });
        } else {
            const allSettings = await db.query.platformSettings.findMany();
            return NextResponse.json(allSettings);
        }
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

// POST: Update or Create a setting (Admin only)
export async function POST(req: NextRequest) {
    try {
        const { session } = await getAuth(await headers());
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { key, value, description } = body;

        if (!key) {
            return NextResponse.json({ error: "Key is required" }, { status: 400 });
        }

        // Upsert logic
        await db.insert(platformSettings).values({
            key,
            value: String(value),
            description,
            updatedBy: session.address
        }).onConflictDoUpdate({
            target: platformSettings.key,
            set: {
                value: String(value),
                description: description || undefined, // Only update description if provided
                updatedBy: session.address,
                updatedAt: new Date(),
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating setting:", error);
        return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
    }
}
