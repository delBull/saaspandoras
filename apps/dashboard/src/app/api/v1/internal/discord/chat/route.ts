import { NextResponse } from 'next/server';
import { HermesRuntime, getDefaultRuntime } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { ActorIdentityBindingService } from '@/lib/pandoras/core/domains/hermes/runtime/prompt-hygiene-contract';

export async function POST(req: Request) {
  try {
    const internalSecret = process.env.INTERNAL_SECRET;
    if (!internalSecret) {
      console.error('[Internal Discord Chat API] Fail-closed: INTERNAL_SECRET is not configured on server.');
      return NextResponse.json({ success: false, error: 'Gateway configuration error' }, { status: 503 });
    }

    const secret = req.headers.get('x-internal-secret');
    if (secret !== internalSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized gateway' }, { status: 401 });
    }

    const payload = await req.json();
    const { discordUserId, discordUsername, content, channelId, guildId } = payload;

    if (!content) {
       return NextResponse.json({ success: false, error: 'Missing content' }, { status: 400 });
    }

    const { db } = await import('@/db');
    const { nexusCollaborators } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const collaborator = await db.query.nexusCollaborators.findFirst({
        where: eq(nexusCollaborators.discordUserId, discordUserId)
    });

    if (!collaborator || new Date(collaborator.expiresAt).getTime() < Date.now()) {
        console.warn(`[Discord Security] Rejecting unauthorized message from Discord ID: ${discordUserId}`);
        return NextResponse.json({ success: false, error: 'Acceso Denegado. Discord ID no autorizado o expirado.' }, { status: 403 });
    }

    const organizationId = 'pandoras'; 
    const actorId = `discord_${discordUserId}`;
    const conversationId = `conv_discord_${discordUserId}_${channelId}`;

    const boundActorSession = ActorIdentityBindingService.createBoundSession(
      {
        actorId,
        tenantId: organizationId,
        authProvider: 'PORTAL_INTERNAL',
        nonce: `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        proofSignature: `sig_${organizationId}_${Date.now()}`,
        issuedAt: Date.now(),
      },
      'TENANT_RESTRICTED',
      3600
    );

    const controlPlaneContext: any = {
      organizationId,
      actorId,
      role: 'TENANT_ADMIN',
      sessionId: boundActorSession.sessionToken,
      permissions: ['read:knowledge', 'execute:capabilities'],
      boundActorSession,
    };

    const runtime = getDefaultRuntime();

    const response = await runtime.respond({
      organizationId,
      conversationId,
      message: {
        id: `msg_${Date.now()}`,
        role: 'USER',
        content: `[System Note: Discord Channel ID: ${channelId} | User: ${discordUsername}]\n${content}`,
        createdAt: new Date(),
      },
      controlPlaneContext,
    });

    return NextResponse.json({ success: true, reply: response.content });
  } catch (error: any) {
    console.error('[Internal Discord Chat API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
