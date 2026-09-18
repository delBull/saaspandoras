import { NextResponse } from 'next/server';
import { NexusReadAdapter } from '@/lib/pandoras/core/domains/hermes/knowledge/nexus-read-adapter';
import { NexusAuthorizationService } from '@/lib/pandoras/core/domains/nexus/nexus-authorization';

export async function GET(req: Request) {
  try {
    // Basic Authentication simulation
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real flow, the canonical identity is extracted from the JWT or token
    // For this example, we assume auth logic injects trusted context
    const canonicalOrgId = req.headers.get('x-canonical-org-id');
    const actorId = req.headers.get('x-actor-id');
    const telegramUserId = req.headers.get('x-telegram-user-id');

    if (!canonicalOrgId || !actorId) {
      return NextResponse.json({ error: 'Missing required canonical identity headers' }, { status: 400 });
    }

    // Server-side construction of the Resource Scope
    const secureNexusScope = await NexusAuthorizationService.resolveCollaboratorScope(
      canonicalOrgId,
      actorId,
      telegramUserId ? parseInt(telegramUserId) : undefined
    );

    if (!secureNexusScope) {
      return NextResponse.json({ error: 'Unauthorized: Actor lacks Nexus access' }, { status: 403 });
    }

    // Delegate fetching to the adapter which strictly honors the scope
    const inbox = await NexusReadAdapter.getAttentionInbox(secureNexusScope);

    return NextResponse.json(inbox, { status: 200 });
  } catch (error: any) {
    console.error('[Nexus Inbox Endpoint] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
