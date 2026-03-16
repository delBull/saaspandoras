import { NextResponse } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { gamificationRules } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/gamification/rules/[id]
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
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
