import { NextResponse } from 'next/server';
import { HermesRuntime } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { OllamaReasoningProvider } from '@/lib/pandoras/core/domains/hermes/runtime/reasoning-providers';
import { ActorIdentityBindingService } from '@/lib/pandoras/core/domains/hermes/runtime/prompt-hygiene-contract';

const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'dev_secret_key';

export async function POST(req: Request) {
  try {
    const secret = req.headers.get('x-internal-secret');
    if (secret !== INTERNAL_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized gateway' }, { status: 401 });
    }

    const payload = await req.json();
    const { discordUserId, discordUsername, content, channelId, guildId } = payload;

    if (!content) {
       return NextResponse.json({ success: false, error: 'Missing content' }, { status: 400 });
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

    const provider = new OllamaReasoningProvider();
    const runtime = new HermesRuntime(provider);

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
