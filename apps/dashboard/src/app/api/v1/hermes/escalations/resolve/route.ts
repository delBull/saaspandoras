import { NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesConversations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { tenantSlug, conversationId, resolutionSummary } = await req.json();

    if (!tenantSlug || !conversationId) {
      return NextResponse.json({ error: 'tenantSlug and conversationId are required' }, { status: 400 });
    }

    // TODO: Verify Authorization based on tenant (JWT/Session)

    // Update conversation status back to ACTIVE
    await db.update(hermesConversations)
      .set({ 
        status: 'ACTIVE',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(hermesConversations.organizationId, tenantSlug),
          eq(hermesConversations.conversationId, conversationId)
        )
      );

    // TODO: Inject resolutionSummary into Hermes Memory/Context so the agent knows what the human did
    // E.g., await HermesMemoryService.injectSystemMessage(conversationId, `Human Operator resolved the issue: ${resolutionSummary}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
