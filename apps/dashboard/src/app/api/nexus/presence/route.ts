import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { db } from '@saasfly/db';
import { nexusPresence, nexusCollaborators, users } from '@saasfly/db/schema';
import { eq, desc, sql } from "@saasfly/db-core";
import { getNexusAuthContext } from '@saasfly/shared';

const PRESENCE_VALID_STATUSES = ['ONLINE', 'OFFLINE', 'DO_NOT_DISTURB', 'IN_MEETING'] as const;
type PresenceValidStatus = (typeof PRESENCE_VALID_STATUSES)[number];

const PRESENCE_VALID_CHANNELS = ['NEXUS_CHAT', 'TELEGRAM', 'WHATSAPP', 'EMAIL'] as const;
type PresenceValidChannel = (typeof PRESENCE_VALID_CHANNELS)[number];

interface PresenceRequestBody {
  status?: string;
  preferredChannel?: string;
  context?: string;
}

export async function GET() {
  try {
    const reqHeaders = await headers();
    const auth = await getNexusAuthContext(reqHeaders);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = auth.canonicalOrgId ?? 'pandoras';
    const isHqOrg = orgId === 'pandoras' || orgId === 'pandoras-core';

    const baseQuery = db
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
        whatsappPhone: nexusCollaborators.whatsappPhone,
        telegramUsername: nexusCollaborators.telegramUsername,
        image: users.image,
      })
      .from(nexusPresence)
      .innerJoin(nexusCollaborators, eq(nexusPresence.collaboratorId, nexusCollaborators.id))
      .leftJoin(users, sql`LOWER(${users.email}) = LOWER(${nexusCollaborators.email})`);

    const presenceData = isHqOrg
      ? await baseQuery
          .where(sql`(${nexusCollaborators.canonicalOrgId} = ${orgId} OR ${nexusCollaborators.canonicalOrgId} = 'pandoras' OR ${nexusCollaborators.canonicalOrgId} IS NULL)`)
          .orderBy(desc(nexusPresence.lastSeenAt))
      : await baseQuery
          .where(eq(nexusCollaborators.canonicalOrgId, orgId))
          .orderBy(desc(nexusPresence.lastSeenAt));

    return NextResponse.json({ presence: presenceData });
  } catch (error: unknown) {
    // Migration-lag tolerance: if the nexus_presence table has not been applied
    // to the active environment yet, report empty presence instead of a 500.
    const err = error as { message?: string; cause?: { message?: string } } | null;
    const errorMessage = err?.message ?? '';
    const causeMessage = err?.cause?.message ?? '';
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
    const reqHeaders = await headers();
    const auth = await getNexusAuthContext(reqHeaders);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let collaboratorId = auth.collaboratorId;
    if (!collaboratorId && auth.email) {
      // Auto-resolve collaboratorId if available by email
      const [collab] = await db
        .select({ id: nexusCollaborators.id })
        .from(nexusCollaborators)
        .where(eq(nexusCollaborators.email, auth.email))
        .limit(1);
      if (collab) {
        collaboratorId = collab.id;
      } else if (auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN') {
        // Auto-provision collaborator record for platform admins so their presence dock never fails
        try {
          const rawToken = crypto.randomUUID();
          const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
          const [newCollab] = await db
            .insert(nexusCollaborators)
            .values({
              name: auth.name ?? 'Admin',
              email: auth.email.toLowerCase().trim(),
              token: tokenHash,
              role: auth.role,
              canonicalOrgId: auth.canonicalOrgId ?? 'pandoras',
              whatsappPhone: auth.whatsappPhone ?? null,
              status: 'ACTIVE',
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            })
            .returning({ id: nexusCollaborators.id });
          if (newCollab) {
            collaboratorId = newCollab.id;
          }
        } catch (_collabErr) {
          // If concurrent insert occurred, attempt re-fetch
          const [collabRetry] = await db
            .select({ id: nexusCollaborators.id })
            .from(nexusCollaborators)
            .where(eq(nexusCollaborators.email, auth.email))
            .limit(1);
          if (collabRetry) {
            collaboratorId = collabRetry.id;
          }
        }
      }
    }

    if (!collaboratorId) {
      return NextResponse.json({ error: 'Not a linked collaborator' }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as PresenceRequestBody;
    const status: PresenceValidStatus = 
      typeof body.status === 'string' && (PRESENCE_VALID_STATUSES as readonly string[]).includes(body.status)
        ? (body.status as PresenceValidStatus)
        : 'ONLINE';
    const preferredChannel: PresenceValidChannel = 
      typeof body.preferredChannel === 'string' && (PRESENCE_VALID_CHANNELS as readonly string[]).includes(body.preferredChannel)
        ? (body.preferredChannel as PresenceValidChannel)
        : 'NEXUS_CHAT';
    const context = typeof body.context === 'string' ? body.context.slice(0, 255) : null;

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
      } catch (insertErr: unknown) {
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
  } catch (error: unknown) {
    const err = error as { message?: string } | null;
    const relationMissing =
      typeof err?.message === 'string' &&
      /relation "?nexus_presence"? does not exist|undefined_table|_nexus_presence/.test(err.message);
    if (relationMissing) {
      console.warn('[PRESENCE_POST] nexus_presence table not found yet (migration pending).');
      return NextResponse.json({ ok: false, reason: 'PRESENCE_MIGRATION_PENDING' }, { status: 503 });
    }
    console.error('[PRESENCE_POST_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}