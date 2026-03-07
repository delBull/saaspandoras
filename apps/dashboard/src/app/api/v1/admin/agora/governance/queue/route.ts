import { NextResponse } from 'next/server';
import { db } from '@/db';
import { protocolConfigQueues } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const protocolIdStr = searchParams.get('protocolId');

        if (!protocolIdStr) {
            return NextResponse.json({ success: false, error: 'Missing protocolId' }, { status: 400 });
        }

        const protocolId = parseInt(protocolIdStr, 10);

        const queue = await db.query.protocolConfigQueues.findMany({
            where: eq(protocolConfigQueues.protocolId, protocolId),
            orderBy: [desc(protocolConfigQueues.createdAt)]
        });

        return NextResponse.json({ success: true, data: queue });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
