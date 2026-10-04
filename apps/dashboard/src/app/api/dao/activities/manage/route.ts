
import { NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { daoActivitySubmissions, daoActivities } from '@saasfly/db/schema';
import { eq } from "@saasfly/db-core";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { submissionId, status, feedback } = body; // status: 'approved' | 'rejected'

        if (!submissionId || !status) {
            return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 });
        }

        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid Status' }, { status: 400 });
        }

        // TODO: Verify user is owner/admin of project

        const updatedSubmission = await db.update(daoActivitySubmissions)
            .set({
                status,
                feedback,
                reviewedAt: new Date()
            })
            .where(eq(daoActivitySubmissions.id, submissionId))
            .returning();

        return NextResponse.json(updatedSubmission[0]);
    } catch (error) {
        console.error('Error reviewing submission:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
