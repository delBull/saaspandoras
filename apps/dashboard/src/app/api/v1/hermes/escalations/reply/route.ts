import { NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesConversations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import axios from 'axios'; // We will use axios to hit the outbound webhook of the Edge (Telegram Bot)

export async function POST(req: Request) {
  try {
    const { tenantSlug, conversationId, message, channel } = await req.json();

    if (!tenantSlug || !conversationId || !message) {
      return NextResponse.json({ error: 'tenantSlug, conversationId and message are required' }, { status: 400 });
    }

    // TODO: Verify Authorization based on tenant (JWT/Session)

    // Verify conversation is actually paused
    const activeConversation = await db.query.hermesConversations.findFirst({
        where: (conv, { eq, and }) => and(
            eq(conv.organizationId, tenantSlug),
            eq(conv.conversationId, conversationId)
        )
    });

    if (activeConversation?.status !== 'PAUSED_HUMAN') {
       return NextResponse.json({ error: 'Conversation is not in PAUSED_HUMAN state' }, { status: 400 });
    }

    // Dispatch message to Edge Outbound Queue (Telegram Bot or Web)
    // For Telegram, the edge webhook is `/api/v1/external/telegram/outbound` or we can call Telegram API directly if we have the bot token.
    // In this architecture, saaspandoras should place it in ChannelOutbound, or call the Edge API.
    // For now, we will simulate the outbound dispatch or call the Edge API directly.
    
    // In our architecture, the edge exposes a secure outbound webhook:
    const edgeOutboundUrl = process.env.EDGE_OUTBOUND_WEBHOOK_URL || 'http://localhost:3000/api/telegram/outbound';
    
    try {
        await axios.post(edgeOutboundUrl, {
            chatId: conversationId,
            text: message,
            tenantId: tenantSlug
        }, {
            headers: {
                'x-edge-secret': process.env.EDGE_SECRET_KEY || ''
            }
        });
    } catch (edgeErr: any) {
        console.error('[HITL Reply] Failed to dispatch to edge:', edgeErr.message);
        // We continue because maybe it's not telegram or we log the error
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
