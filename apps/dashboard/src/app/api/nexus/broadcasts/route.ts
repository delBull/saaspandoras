/**
 * 📢 Nexus Broadcasts & Central Notification API
 * apps/dashboard/src/app/api/nexus/broadcasts/route.ts
 *
 * Handles creation, listing, and archiving of global or targeted announcements
 * for nexus.pandoras.finance.
 *
 * SECURITY MODEL (Fail-Closed):
 * - Authorization strictly derived from server-side Web3 / Collaborator session (getNexusAuthContext).
 * - Client body parameters (authorRole, authorEmail) are NEVER trusted as authority.
 * - GET ?all=true requires SUPER_ADMIN or ADMIN authentication.
 * - Standard GET only serves targeted broadcasts if server-authenticated identity matches.
 * - PATCH requires SUPER_ADMIN or ADMIN authentication and validates UUID format.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { nexusBroadcasts, nexusCollaborators } from '@/db/schema';
import { eq, desc, and, or, isNull, isNotNull, gt } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/lib/whatsapp/utils/client';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/nexus/broadcasts
 * Retrieves active broadcasts.
 * - If `?all=true`: Requires SUPER_ADMIN or ADMIN authentication.
 * - Otherwise: Delivers GLOBAL broadcasts + broadcasts targeted to the verified server session.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    // 1. Server-side Authentication Resolution
    const auth = await getNexusAuthContext(req.headers);

    // 2. Admin Management Listing (all=true)
    if (all) {
      if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Admin authentication required to list all broadcasts.' },
          { status: 403 }
        );
      }

      const broadcasts = await db
        .select()
        .from(nexusBroadcasts)
        .orderBy(desc(nexusBroadcasts.createdAt))
        .limit(50);

      return NextResponse.json({ success: true, broadcasts });
    }

    // 3. User Facing Active Feed (Delivers GLOBAL + Authenticated Targets)
    const now = new Date();
    const conditions = [
      eq(nexusBroadcasts.isActive, true),
      or(isNull(nexusBroadcasts.expiresAt), gt(nexusBroadcasts.expiresAt, now)),
    ];

    // Base: Always deliver GLOBAL announcements
    const targetConditions = [eq(nexusBroadcasts.targetType, 'GLOBAL')];

    // Only deliver user/role targeted broadcasts if actor is cryptographically authenticated
    if (auth.isAuthenticated) {
      if (auth.email) {
        targetConditions.push(
          and(eq(nexusBroadcasts.targetType, 'USER'), eq(nexusBroadcasts.targetEmail, auth.email.toLowerCase().trim()))!
        );
      }
      if (auth.role) {
        targetConditions.push(
          and(eq(nexusBroadcasts.targetType, 'ROLE'), eq(nexusBroadcasts.targetRole, auth.role))!
        );
      }
    }

    const broadcasts = await db
      .select()
      .from(nexusBroadcasts)
      .where(and(...conditions, or(...targetConditions)))
      .orderBy(desc(nexusBroadcasts.createdAt))
      .limit(20);

    return NextResponse.json({ success: true, broadcasts });
  } catch (error) {
    console.error('[Nexus Broadcasts API] GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nexus/broadcasts
 * Creates and publishes a new central notification.
 * Security: Server-side enforced. Only authenticated SUPER_ADMIN or ADMIN can publish.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Server-side Authentication (Fail-Closed)
    const auth = await getNexusAuthContext(req.headers);
    if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only authenticated SUPER_ADMIN and ADMIN can publish Nexus broadcasts.',
        },
        { status: 403 }
      );
    }

    // 2. Validate Payload
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const {
      title,
      content,
      type = 'ANNOUNCEMENT',
      targetType = 'GLOBAL',
      targetEmail,
      targetRole,
      expiresInDays,
      notifyWhatsApp = true,
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    // Server-enforced author identity (CLIENT CANNOT SPOOF ROLE OR EMAIL)
    const authorRole = auth.role;
    const authorEmail = auth.email || null;
    const authorName = (auth.name || body.authorName || auth.wallet || 'Nexus Admin').trim();

    // Calculate expiration if provided
    let expiresAt: Date | null = null;
    if (expiresInDays && Number(expiresInDays) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000);
    }

    // 3. Persist to Database
    const [inserted] = await db
      .insert(nexusBroadcasts)
      .values({
        title: title.trim(),
        content: content.trim(),
        type: ['ANNOUNCEMENT', 'ALERT', 'UPDATE', 'URGENT'].includes(type) ? type : 'ANNOUNCEMENT',
        targetType: ['GLOBAL', 'USER', 'ROLE'].includes(targetType) ? targetType : 'GLOBAL',
        targetEmail: targetType === 'USER' && targetEmail ? targetEmail.toLowerCase().trim() : null,
        targetRole: targetType === 'ROLE' && targetRole ? targetRole.toUpperCase().trim() : null,
        authorName,
        authorEmail,
        authorRole,
        isActive: true,
        expiresAt,
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to create broadcast in database');
    }

    // 4. Dispatch WhatsApp notifications to relevant collaborators
    let whatsappDispatched = 0;
    const whatsappErrors: string[] = [];

    if (notifyWhatsApp !== false) {
      try {
        const collabConditions = [
          eq(nexusCollaborators.status, 'ACTIVE'),
          isNotNull(nexusCollaborators.whatsappPhone),
        ];

        if (targetType === 'USER' && targetEmail) {
          collabConditions.push(eq(nexusCollaborators.email, targetEmail.toLowerCase().trim()));
        } else if (targetType === 'ROLE' && targetRole) {
          collabConditions.push(eq(nexusCollaborators.role, targetRole.toUpperCase().trim()));
        }

        const recipients = await db
          .select({
            name: nexusCollaborators.name,
            email: nexusCollaborators.email,
            phone: nexusCollaborators.whatsappPhone,
          })
          .from(nexusCollaborators)
          .where(and(...collabConditions));

        for (const recipient of recipients) {
          if (!recipient.phone || recipient.phone.trim().length < 6) continue;
          const waMessage = formatBroadcastWhatsAppMessage(inserted, recipient.name);
          try {
            const result = await sendWhatsAppMessage(recipient.phone, waMessage);
            if (result.success) {
              whatsappDispatched++;
            } else {
              whatsappErrors.push(`${recipient.name} (${recipient.phone}): ${result.error || 'Entrega fallida'}`);
            }
          } catch (err: any) {
            whatsappErrors.push(`${recipient.name} (${recipient.phone}): ${err.message}`);
          }
        }
      } catch (waErr: any) {
        console.error('[Nexus Broadcasts API] WhatsApp recipient query error:', waErr);
        whatsappErrors.push(`Error consultando colaboradores: ${waErr.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      broadcast: inserted,
      whatsappSummary: {
        dispatched: whatsappDispatched,
        errors: whatsappErrors,
      },
    });
  } catch (error) {
    console.error('[Nexus Broadcasts API] POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Formats a broadcast alert for WhatsApp delivery with clear origin, title, and structure.
 * Includes length guard to protect against WhatsApp Cloud API body truncation.
 */
export function formatBroadcastWhatsAppMessage(
  broadcast: {
    title: string;
    content: string;
    type: string;
    targetType: string;
    authorName: string;
    authorRole?: string | null;
  },
  recipientName: string
): string {
  const typeLabels: Record<string, string> = {
    ANNOUNCEMENT: '📢 ANUNCIO OFICIAL',
    ALERT: '⚠️ AVISO IMPORTANTE',
    UPDATE: '💡 ACTUALIZACIÓN',
    URGENT: '🚨 ALERTA URGENTE',
  };

  const badge = typeLabels[broadcast.type] || '📢 COMUNICADO';
  const authorBadge = broadcast.authorRole
    ? `${broadcast.authorName} (${broadcast.authorRole})`
    : broadcast.authorName;

  // Length guard for WhatsApp Cloud API (4096 char limit)
  let safeContent = broadcast.content;
  if (safeContent.length > 3000) {
    safeContent = safeContent.slice(0, 3000) + '\n\n...[Ver mensaje completo en Nexus]';
  }

  return `*🔔 NEXUS OPERATIONS HUB · ${badge}*

Hola *${recipientName}*,

*${broadcast.title}*

${safeContent}

━━━━━━━━━━━━━━━━━━━━
👤 *De parte de:* ${authorBadge}
🌐 *Acceso Nexus:* https://nexus.pandoras.finance
_Notificación oficial emitida desde Nexus Operations Hub_`;
}

/**
 * PATCH /api/nexus/broadcasts
 * Deactivates or reactivates a broadcast.
 * Security: Server-side enforced. Only authenticated SUPER_ADMIN or ADMIN can modify.
 */
export async function PATCH(req: NextRequest) {
  try {
    // 1. Server-side Authentication (Fail-Closed)
    const auth = await getNexusAuthContext(req.headers);
    if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only authenticated SUPER_ADMIN and ADMIN can modify broadcasts.' },
        { status: 403 }
      );
    }

    // 2. Validate Payload
    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json({ success: false, error: 'Broadcast ID is required' }, { status: 400 });
    }

    const { id, isActive } = body;

    // UUID format validation
    if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid UUID format for broadcast ID' }, { status: 400 });
    }

    const [updated] = await db
      .update(nexusBroadcasts)
      .set({
        isActive: Boolean(isActive),
        updatedAt: new Date(),
      })
      .where(eq(nexusBroadcasts.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Broadcast not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, broadcast: updated });
  } catch (error) {
    console.error('[Nexus Broadcasts API] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
