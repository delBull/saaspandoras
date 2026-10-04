import { NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { daoMembers, users } from '@saasfly/db/schema';
import { eq, desc } from "@saasfly/db-core";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const projectIdStr = searchParams.get('projectId');

    if (!projectIdStr) {
        return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const projectId = Number(projectIdStr);

    try {
        const members = await db
            .select({
                id: daoMembers.id,
                wallet: daoMembers.wallet,
                votingPower: daoMembers.votingPower,
                artifactsCount: daoMembers.artifactsCount,
                joinedAt: daoMembers.joinedAt,
                lastActiveAt: daoMembers.lastActiveAt
            })
            .from(daoMembers)
            .where(eq(daoMembers.projectId, projectId))
            .orderBy(desc(daoMembers.votingPower))
            .limit(50);

        return NextResponse.json(members);

    } catch (error) {
        console.error('Error fetching DAO members:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
