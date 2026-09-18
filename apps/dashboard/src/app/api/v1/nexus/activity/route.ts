import { NextResponse } from 'next/server';
import { db } from '@/db';
import { nexusAuditEvents } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { NexusAuthorizationService } from '@/lib/pandoras/core/domains/nexus/nexus-authorization';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canonicalOrgId = req.headers.get('x-canonical-org-id');
    const actorId = req.headers.get('x-actor-id');
    const telegramUserId = req.headers.get('x-telegram-user-id');

    if (!canonicalOrgId || !actorId) {
      return NextResponse.json({ error: 'Missing required canonical identity headers' }, { status: 400 });
    }

    const secureNexusScope = await NexusAuthorizationService.resolveCollaboratorScope(
      canonicalOrgId,
      actorId,
      telegramUserId ? parseInt(telegramUserId) : undefined
    );

    if (!secureNexusScope) {
      return NextResponse.json({ error: 'Unauthorized: Actor lacks Nexus access' }, { status: 403 });
    }

    // In a real scenario we might filter this by resource scope (e.g. only events for queues they can see)
    // For MVP, if they have global read access, we return recent audit events
    const hasGlobalRead = secureNexusScope.permissions['nexus.manage'] || secureNexusScope.permissions['compliance.manage'];
    
    if (!hasGlobalRead) {
      return NextResponse.json({ events: [] }, { status: 200 }); // Or restrict to their own events
    }

    const events = await db.select()
      .from(nexusAuditEvents)
      .where(eq(nexusAuditEvents.canonicalOrgId, secureNexusScope.canonicalOrgId))
      .orderBy(desc(nexusAuditEvents.createdAt))
      .limit(20);

    return NextResponse.json({ events }, { status: 200 });
  } catch (error: any) {
    console.error('[Nexus Activity Endpoint] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
