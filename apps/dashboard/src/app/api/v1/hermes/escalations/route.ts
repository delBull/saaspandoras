import { NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesConversations } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug');

    if (!tenantSlug) {
      return NextResponse.json({ error: 'tenantSlug is required' }, { status: 400 });
    }

    // TODO: Verify Authorization based on tenant (JWT/Session)

    const escalations = await db.query.hermesConversations.findMany({
      where: (conv, { eq, and }) => and(
        eq(conv.organizationId, tenantSlug),
        eq(conv.status, 'PAUSED_HUMAN')
      ),
      orderBy: [desc(hermesConversations.escalatedAt)]
    });

    return NextResponse.json({ success: true, data: escalations });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
