import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db';
import { nexusDirectMessages } from '@saasfly/db/schema';
import { eq, and, or, asc } from '@saasfly/db-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SendMessageBody {
  receiverEmail?: string;
  receiverName?: string;
  content?: string;
}

/**
 * 💬 GET /api/nexus/chat?targetEmail=xxx
 * Returns recent direct messages between authenticated operator and target collaborator.
 */
export async function GET(req: Request) {
  try {
    const auth = await getNexusAuthContext(req.headers);
    if (!auth.isAuthenticated || !auth.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetEmail = searchParams.get('targetEmail')?.toLowerCase().trim();

    if (!targetEmail) {
      return NextResponse.json({ error: 'targetEmail query parameter is required' }, { status: 400 });
    }

    const myEmail = auth.email.toLowerCase().trim();
    const orgId = auth.canonicalOrgId ?? 'pandoras';

    try {
      // Fetch messages exchanged between myEmail and targetEmail
      const messages = await db
        .select()
        .from(nexusDirectMessages)
        .where(
          and(
            eq(nexusDirectMessages.canonicalOrgId, orgId),
            or(
              and(
                eq(nexusDirectMessages.senderEmail, myEmail),
                eq(nexusDirectMessages.receiverEmail, targetEmail)
              ),
              and(
                eq(nexusDirectMessages.senderEmail, targetEmail),
                eq(nexusDirectMessages.receiverEmail, myEmail)
              )
            )
          )
        )
        .orderBy(asc(nexusDirectMessages.createdAt))
        .limit(100);

      return NextResponse.json({
        ok: true,
        myEmail,
        targetEmail,
        messages,
      });
    } catch (dbErr: unknown) {
      const err = dbErr as { message?: string; cause?: { message?: string } };
      const errorMessage = err?.message ?? '';
      const causeMessage = err?.cause?.message ?? '';

      // Migration-lag tolerance: if nexus_direct_messages table is not migrated yet
      if (
        /relation "?nexus_direct_messages"? does not exist|undefined_table|_nexus_direct_messages/.test(errorMessage) ||
        /relation "?nexus_direct_messages"? does not exist|undefined_table|_nexus_direct_messages/.test(causeMessage)
      ) {
        console.warn('[NEXUS_CHAT_GET] nexus_direct_messages table not found yet (migration pending) — returning empty.');
        return NextResponse.json({ ok: true, myEmail, targetEmail, messages: [] });
      }
      throw dbErr;
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[NEXUS_CHAT_GET_ERROR]', err);
    return NextResponse.json(
      { error: err?.message ?? 'Failed to retrieve messages' },
      { status: 500 }
    );
  }
}

/**
 * 💬 POST /api/nexus/chat
 * Sends a rapid direct message to a collaborator within the same canonicalOrgId.
 */
export async function POST(req: Request) {
  try {
    const auth = await getNexusAuthContext(req.headers);
    if (!auth.isAuthenticated || !auth.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as SendMessageBody;
    const receiverEmail = body.receiverEmail?.toLowerCase().trim();
    const receiverName = body.receiverName?.trim();
    const content = body.content?.trim();

    if (!receiverEmail || !content) {
      return NextResponse.json(
        { error: 'receiverEmail and content are required' },
        { status: 400 }
      );
    }

    const myEmail = auth.email.toLowerCase().trim();
    const emailPrefix = auth.email.split('@')[0] ?? 'Operador';
    const senderName = auth.name?.trim() ? auth.name.trim() : emailPrefix;
    const orgId = auth.canonicalOrgId ?? 'pandoras';

    try {
      const inserted = await db
        .insert(nexusDirectMessages)
        .values({
          canonicalOrgId: orgId,
          senderEmail: myEmail,
          senderName,
          receiverEmail,
          receiverName: receiverName ?? null,
          content,
        })
        .returning();

      return NextResponse.json({
        ok: true,
        message: inserted[0] ?? null,
      });
    } catch (dbErr: unknown) {
      const err = dbErr as { message?: string; cause?: { message?: string } };
      const errorMessage = err?.message ?? '';
      const causeMessage = err?.cause?.message ?? '';

      if (
        /relation "?nexus_direct_messages"? does not exist|undefined_table|_nexus_direct_messages/.test(errorMessage) ||
        /relation "?nexus_direct_messages"? does not exist|undefined_table|_nexus_direct_messages/.test(causeMessage)
      ) {
        console.warn('[NEXUS_CHAT_POST] nexus_direct_messages table not found yet (migration pending).');
        return NextResponse.json(
          { ok: false, reason: 'CHAT_MIGRATION_PENDING', error: 'Tabla de chat en migración' },
          { status: 503 }
        );
      }
      throw dbErr;
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[NEXUS_CHAT_POST_ERROR]', err);
    return NextResponse.json(
      { error: err?.message ?? 'Failed to send direct message' },
      { status: 500 }
    );
  }
}
