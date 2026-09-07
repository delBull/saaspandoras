import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { nexusCollaborators, nexusDealRooms, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const body = await req.json();
    const { dealRoomId, targetIdentityId } = body;

    // Mock resolving the caller (admin) for demonstration of the flow
    // In production we read this from the session token
    const adminEmail = req.headers.get('x-user-email') || 'mock_admin@example.com';
    
    // 1. Fetch the Admin's contact info (WhatsApp/Telegram) from Nexus
    const admin = await db.query.nexusCollaborators.findFirst({
      where: (collab, { eq }) => eq(collab.email, adminEmail)
    });

    if (!admin) {
        return NextResponse.json({ ok: false, error: 'Admin collaborator profile not found' }, { status: 404 });
    }

    // 2. Fetch Deal/Context
    let contextStr = '';
    if (dealRoomId) {
        const deal = await db.query.nexusDealRooms.findFirst({ where: eq(nexusDealRooms.id, dealRoomId) });
        if (deal) contextStr = `Deal: ${deal.title}\nStatus: ${deal.status}\nPhase: ${deal.ndaPhase}`;
    }

    if (!admin.whatsappPhone && !admin.discordUserId) {
         return NextResponse.json({ ok: false, error: 'Admin has no WhatsApp or Telegram registered in Nexus.' }, { status: 400 });
    }

    const adminChannel = admin.whatsappPhone ? 'whatsapp' : 'telegram';
    const adminExternalId = admin.whatsappPhone || admin.discordUserId || ''; // mock using discordId as TG ID for now
    
    // 3. Dispatch the outbound push message via Hermes Engine / Edge
    const { HermesExecutionEngine } = await import('@/lib/hermes/kernel/execution/execution-api');
    const engine = new HermesExecutionEngine();
    
    // We send an "internal" message to Hermes instructing it to message the admin
    const request = {
        requestId: `invoke-${Date.now()}`,
        executionId: `sys-${Date.now()}`,
        tenantId: projectId,
        requester: 'system_nexus',
        channel: adminChannel as any,
        capability: 'communication.route',
        executionProfile: 'interactive' as const,
        identity: { userId: adminExternalId },
        priority: 'high' as const,
        payload: {
            projectId: projectId,
            chatId: adminExternalId,
            userMessage: `[SYSTEM CONTEXT INJECTION]\nEl admin está revisando el contexto del cliente.\nContexto:\n${contextStr}\n\nInicia la conversación preguntándole al admin qué necesita saber sobre este deal.`,
            raw: {}
        }
    };

    // This executes Hermes which will generate the reply and push it via the channel
    const result = await engine.execute(request);

    return NextResponse.json({ 
        ok: true, 
        dispatched: true, 
        channel: adminChannel,
        message: 'Hermes ha sido invocado. Recibirás un mensaje en breve.'
    });

  } catch (error: any) {
    console.error('[Hermes Invoke] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
