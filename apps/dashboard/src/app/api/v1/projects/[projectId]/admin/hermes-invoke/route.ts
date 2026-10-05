import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { nexusCollaborators, nexusDealRooms, projects } from '@saasfly/db/schema';
import { eq, and } from "@saasfly/db-core";

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
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
    
    // 3. Dispatch the outbound push message via Hermes Runtime
    const { getDefaultRuntime } = await import('@saasfly/hermes-core');
    const runtime = getDefaultRuntime();
    
    // We send an "internal" message to Hermes instructing it to message the admin
    const runtimeResponse = await runtime.respond({
      organizationId: projectId,
      conversationId: `conv_${adminChannel}_${projectId}_${adminExternalId}`,
      message: {
        id: `sys-${Date.now()}`,
        role: 'SYSTEM',
        content: `[SYSTEM CONTEXT INJECTION]\nEl admin está revisando el contexto del cliente.\nContexto:\n${contextStr}\n\nInicia la conversación preguntándole al admin qué necesita saber sobre este deal.`,
        createdAt: new Date(),
      },
      controlPlaneContext: {
        actorId: `admin_${adminExternalId}`,
        organizationId: projectId,
        role: 'ADMIN',
        permissions: ['view_overview', 'view_governance'],
        sessionId: `invoke_sess_${projectId}_${adminExternalId}`,
        channel: adminChannel,
      }
    });

    // We rely on the adapter or subsequent push to deliver the content, or for now we mock it as the comment suggests.
    const result = { reply: runtimeResponse.content };

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
