import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@saasfly/db';
import { nexusPresence, nexusCollaborators } from '@saasfly/db/schema';
import { eq, desc } from "@saasfly/db-core";
import { getNexusAuthContext } from '@saasfly/shared';

const PRESENCE_VALID_STATUSES = ['ONLINE', 'OFFLINE', 'DO_NOT_DISTURB', 'IN_MEETING'];
const PRESENCE_VALID_CHANNELS = ['NEXUS_CHAT', 'TELEGRAM', 'WHATSAPP', 'EMAIL'];

export async function GET() {
  try {
    const auth = await getNexusAuthContext();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const presenceData = await db
      .select({
        id: nexusPresence.id,
        collaboratorId: nexusPresence.collaboratorId,
        status: nexusPresence.status,
        context: nexusPresence.context,
        preferredChannel: nexusPresence.preferredChannel,
        lastSeenAt: nexusPresence.lastSeenAt,
        name: nexusCollaborators.name,
        email: nexusCollaborators.email,
        role: nexusCollaborators.role,
      })
      .from(nexusPresence)
      .innerJoin(nexusCollaborators, eq(nexusPresence.collaboratorId, nexusCollaborators.id))
      .orderBy(desc(nexusPresence.lastSeenAt));

    return NextResponse.json({ presence: presenceData });
  } catch (error: any) {
    // Migration-lag tolerance: if the nexus_presence table has not been applied
    // to the active environment yet, report empty presence instead of a 500.
    const errorMessage = error?.message || '';
    const causeMessage = error?.cause?.message || '';
    const relationMissing =
      /relation "?nexus_presence"? does not exist|undefined_table|_nexus_presence/.test(errorMessage) ||
      /relation "?nexus_presence"? does not exist|undefined_table|_nexus_presence/.test(causeMessage);
    if (relationMissing) {
      console.warn('[PRESENCE_GET] nexus_presence table not found yet (migration pending) — returning empty.');
      return NextResponse.json({ presence: [] });
    }
    console.error('[PRESENCE_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getNexusAuthContext();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collaboratorId = auth.collaboratorId;
    if (!collaboratorId) {
      return NextResponse.json({ error: 'Not a linked collaborator' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const status = PRESENCE_VALID_STATUSES.includes(body?.status) ? body.status : 'ONLINE';
    const preferredChannel = PRESENCE_VALID_CHANNELS.includes(body?.preferredChannel) ? body.preferredChannel : 'NEXUS_CHAT';
    const context = typeof body?.context === 'string' ? body.context.slice(0, 255) : null;

    const now = new Date();

    const [existing] = await db
      .select({ id: nexusPresence.id })
      .from(nexusPresence)
      .where(eq(nexusPresence.collaboratorId, collaboratorId))
      .limit(1);

    if (existing) {
      await db
        .update(nexusPresence)
        .set({ status, context, preferredChannel, lastSeenAt: now, updatedAt: now })
        .where(eq(nexusPresence.id, existing.id));
    } else {
      try {
        await db
          .insert(nexusPresence)
          .values({ collaboratorId, status, context, preferredChannel, lastSeenAt: now, updatedAt: now });
      } catch (insertErr: any) {
        // Race tolerance: if a concurrent heartbeat inserted the row first,
        // retry as an update against the winner.
        const [winner] = await db
          .select({ id: nexusPresence.id })
          .from(nexusPresence)
          .where(eq(nexusPresence.collaboratorId, collaboratorId))
          .limit(1);
        if (winner) {
          await db
            .update(nexusPresence)
            .set({ status, context, preferredChannel, lastSeenAt: now, updatedAt: now })
            .where(eq(nexusPresence.id, winner.id));
        } else {
          throw insertErr;
        }
      }
    }

    return NextResponse.json({ ok: true, status, lastSeenAt: now.toISOString() });
  } catch (error: any) {
    const relationMissing =
      typeof error?.message === 'string' &&
      /relation "?nexus_presence"? does not exist|undefined_table|_nexus_presence/.test(error.message);
    if (relationMissing) {
      console.warn('[PRESENCE_POST] nexus_presence table not found yet (migration pending).');
      return NextResponse.json({ ok: false, reason: 'PRESENCE_MIGRATION_PENDING' }, { status: 503 });
    }
    console.error('[PRESENCE_POST_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}