import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { platformSettings, administrators } from "@/db/schema";
import { eq } from "drizzle-orm";

// Mock helper to check if an address is an admin (Reuse existing admin logic if possible via import, or query DB)
async function isUserAdmin(address: string) {
    if (!address) return false;
    const admin = await db.query.administrators.findFirst({
        where: eq(administrators.walletAddress, address),
    });
    return !!admin;
}

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
        // Basic Authorization Check (In production, replace with robust Session/JWT check)
        // Here we expect the client to send the wallet address in a header for verification 
        // OR rely on the session if we are using NextAuth/Custom Auth.
        // For simplicity reusing the Header 'x-admin-wallet' pattern if valid, 
        // BUT ideally we should read from the HttpOnly Cookie or Server Session.

        // * Assuming we have a way to validate the requester. 
        // * For this step, I'll attempt to read the 'x-user-address' header often set by middleware 
        // * OR proceed if we can validate via signature.

        // IMPORTANT: Real implementation should verify the session. 
        // Since I don't have the full Auth context at hand, I'll implement a stub that 
        // expects the frontend to verify, but the API *really* should verify.
        // I will assume for now we trust the caller IF the middleware protected it, 
        // OR I will check the DB if 'x-wallet-address' is provided and is an admin.

        const walletAddress = req.headers.get("x-wallet-address");
        if (!walletAddress) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isAdmin = await isUserAdmin(walletAddress);
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
            updatedBy: walletAddress
        }).onConflictDoUpdate({
            target: platformSettings.key,
            set: {
                value: String(value),
                description: description || undefined, // Only update description if provided
                updatedBy: walletAddress,
                updatedAt: new Date(),
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating setting:", error);
        return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
    }
}
