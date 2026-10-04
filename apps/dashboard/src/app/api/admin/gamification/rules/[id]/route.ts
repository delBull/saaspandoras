import { NextResponse } from 'next/server';
import { getAuth, isAdmin } from '@saasfly/auth-sdk';
import { db } from '@saasfly/db';
import { gamificationRules } from '@saasfly/db/schema';
import { eq } from "@saasfly/db-core";

export const dynamic = 'force-dynamic';

// PATCH /api/admin/gamification/rules/[id]
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const id = (await params).id;

        await db.update(gamificationRules)
            .set({
                ...body,
                updatedAt: new Date(),
            })
            .where(eq(gamificationRules.id, id));

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Admin Gamification Rules PATCH]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
