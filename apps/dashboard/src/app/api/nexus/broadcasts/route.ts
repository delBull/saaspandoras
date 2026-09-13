/**
 * 📢 Nexus Broadcasts & Central Notification API
 * apps/dashboard/src/app/api/nexus/broadcasts/route.ts
 *
 * Handles creation, listing, and archiving of global or targeted announcements
 * for nexus.pandoras.finance.
 * Restricted creation: Only SUPER_ADMIN and ADMIN can emit broadcasts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { nexusBroadcasts, nexusCollaborators } from '@/db/schema';
import { eq, desc, and, or, isNull, isNotNull, gt } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/lib/whatsapp/utils/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nexus/broadcasts
 * Retrieves all active broadcasts relevant to the requester (Global + User-targeted + Role-targeted).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.toLowerCase().trim();
    const role = searchParams.get('role')?.toUpperCase().trim();
    const all = searchParams.get('all') === 'true'; // For Operations Hub management

    if (all) {
      // Returns last 50 broadcasts for admin management
      const broadcasts = await db
        .select()
        .from(nexusBroadcasts)
        .orderBy(desc(nexusBroadcasts.createdAt))
        .limit(50);

      return NextResponse.json({ success: true, broadcasts });
    }

    // Filter active broadcasts for the user
    const now = new Date();
    const conditions = [
      eq(nexusBroadcasts.isActive, true),
      or(isNull(nexusBroadcasts.expiresAt), gt(nexusBroadcasts.expiresAt, now)),
    ];

    // Target matching: GLOBAL, or matching user email, or matching user role
    const targetConditions = [eq(nexusBroadcasts.targetType, 'GLOBAL')];
    if (email) {
      targetConditions.push(
        and(eq(nexusBroadcasts.targetType, 'USER'), eq(nexusBroadcasts.targetEmail, email))!
      );
    }
    if (role) {
      targetConditions.push(
        and(eq(nexusBroadcasts.targetType, 'ROLE'), eq(nexusBroadcasts.targetRole, role))!
      );
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
 * Security: Only SUPER_ADMIN and ADMIN roles are authorized.
 */
export async function POST(req: NextRequest) {
  try {
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
      authorName = 'Nexus Ops',
      authorEmail,
      authorRole = 'COLLABORATOR',
      expiresInDays,
    } = body;

    // 1. Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    // 2. Authorization Check (Fail-closed: Only SUPER_ADMIN and ADMIN)
    const normalizedRole = authorRole.toUpperCase().trim();
    const isAuthorizedRole = normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'ADMIN';

    if (!isAuthorizedRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only SUPER_ADMIN and ADMIN can publish Nexus broadcasts.',
        },
        { status: 403 }
      );
    }

    // Calculate expiration if provided
    let expiresAt: Date | null = null;
    if (expiresInDays && Number(expiresInDays) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000);
    }

    // 3. Persist to Neon DB
    const [inserted] = await db
      .insert(nexusBroadcasts)
      .values({
        title: title.trim(),
        content: content.trim(),
        type: ['ANNOUNCEMENT', 'ALERT', 'UPDATE', 'URGENT'].includes(type) ? type : 'ANNOUNCEMENT',
        targetType: ['GLOBAL', 'USER', 'ROLE'].includes(targetType) ? targetType : 'GLOBAL',
        targetEmail: targetType === 'USER' && targetEmail ? targetEmail.toLowerCase().trim() : null,
        targetRole: targetType === 'ROLE' && targetRole ? targetRole.toUpperCase().trim() : null,
        authorName: authorName.trim(),
        authorEmail: authorEmail ? authorEmail.toLowerCase().trim() : null,
        authorRole: normalizedRole,
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

    if (body.notifyWhatsApp !== false) {
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

  return `*🔔 NEXUS OPERATIONS HUB · ${badge}*

Hola *${recipientName}*,

*${broadcast.title}*

${broadcast.content}

━━━━━━━━━━━━━━━━━━━━
👤 *De parte de:* ${authorBadge}
🌐 *Acceso Nexus:* https://nexus.pandoras.finance
_Notificación oficial emitida desde Nexus Operations Hub_`;
}

/**
 * PATCH /api/nexus/broadcasts
 * Deactivates or reactivates a broadcast.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json({ success: false, error: 'Broadcast ID is required' }, { status: 400 });
    }

    const { id, isActive, authorRole } = body;

    // Authorization check
    const normalizedRole = (authorRole || '').toUpperCase().trim();
    if (normalizedRole !== 'SUPER_ADMIN' && normalizedRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only SUPER_ADMIN and ADMIN can modify broadcasts.' },
        { status: 403 }
      );
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
