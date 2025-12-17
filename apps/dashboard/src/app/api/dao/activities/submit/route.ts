
import { NextResponse } from 'next/server';
import { headers } from "next/headers";
import { db } from '@/db';
import { daoActivitySubmissions, daoActivities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { activityId, userWallet, proofData } = body;

        if (!activityId || !userWallet) {
            return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 });
        }

        // Verify Session Auth
        const { session } = await getAuth(await headers());
        if (!session?.address || session.address.toLowerCase() !== userWallet.toLowerCase()) {
            return NextResponse.json({ error: "Unauthorized: Invalid Session" }, { status: 401 });
        }

        // Verify activity exists and is active
        const activity = await db.query.daoActivities.findFirst({
            where: eq(daoActivities.id, activityId)
        });

        if (!activity || activity.status !== 'active') {
            return NextResponse.json({ error: 'Activity not active or not found' }, { status: 400 });
        }

        // Check for duplicate pending submission? (Optional logic, skipping for now to allow retries)

        const submission = await db.insert(daoActivitySubmissions).values({
            activityId,
            userWallet,
            proofData,
            status: 'pending' // Default status
        }).returning();

        return NextResponse.json(submission[0]);
    } catch (error) {
        console.error('Error submitting activity:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
