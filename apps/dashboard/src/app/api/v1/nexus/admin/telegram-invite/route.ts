import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { nexusCollaborators, nexusTelegramInvites } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getNexusAuthContext, checkNexusPermission } from '@/lib/nexus/nexus-rbac';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const auth = await getNexusAuthContext(req.headers);
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require capability to manage nexus collaborators
    if (!checkNexusPermission(auth, 'nexus.manage')) {
      return NextResponse.json({ error: 'Forbidden: Missing nexus.manage capability' }, { status: 403 });
    }

    const body = await req.json();
    const { collaboratorId } = body;

    if (!collaboratorId) {
      return NextResponse.json({ error: 'collaboratorId is required' }, { status: 400 });
    }

    // Identify the caller (Admin) to enforce roles
    if (!auth.email) {
      return NextResponse.json({ error: 'Admin email not resolved in context' }, { status: 403 });
    }

    const [adminCollab] = await db
      .select({ id: nexusCollaborators.id })
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.email, auth.email))
      .limit(1);

    if (!adminCollab) {
      return NextResponse.json({ error: 'Admin collaborator profile not found' }, { status: 403 });
    }

    // Find the target collaborator
    const [targetCollab] = await db
      .select({ 
        id: nexusCollaborators.id, 
        telegramUserId: nexusCollaborators.telegramUserId
      })
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.id, Number(collaboratorId)))
      .limit(1);

    if (!targetCollab) {
      return NextResponse.json({ error: 'Target collaborator not found' }, { status: 404 });
    }

    // Do not generate invite if already bound
    if (targetCollab.telegramUserId) {
      return NextResponse.json({ error: 'Collaborator already has a Telegram binding. Rebinding requires explicit flow.' }, { status: 400 });
    }

    // 1. Generate high-entropy token (32 bytes) and encode compactly
    const rawToken = crypto.randomBytes(32).toString('base64url');
    
    // 2. Hash it for storage (SHA-256)
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 3. Save to nexus_telegram_invites
    const inviteId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(nexusTelegramInvites).values({
      id: inviteId,
      collaboratorId: targetCollab.id,
      tokenHash,
      createdByIdentityId: adminCollab.id,
      status: 'PENDING',
      expiresAt,
    });

    // 4. Return UX response with deep link
    return NextResponse.json({
      ok: true,
      inviteLink: `https://t.me/nexusPandoras_bot?start=${rawToken}`
    });

  } catch (err: any) {
    console.error('[NexusAdmin TelegramInvite] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
