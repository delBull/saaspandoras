import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesConversations, hermesConversationMessages, projects, nexusCollaborators, projectCollaborators } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/lib/whatsapp/utils/client';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const internalSecret = process.env.INTERNAL_SECRET;
    if (!internalSecret) {
      console.error('[Internal Discord HITL API] Fail-closed: INTERNAL_SECRET is not configured on server.');
      return NextResponse.json({ error: 'Gateway configuration error' }, { status: 503 });
    }

    const secret = req.headers.get('x-internal-secret');
    if (secret !== internalSecret) {
      return NextResponse.json({ error: 'Unauthorized gateway' }, { status: 401 });
    }

    const { conversationId, message, discordUserId, releaseTakeover } = await req.json();

    if (!conversationId || !message || !discordUserId) {
      return NextResponse.json({ error: 'Faltan campos (conversationId, message, discordUserId)' }, { status: 400 });
    }

    // 1. Encontrar la conversación
    const [conv] = await db.select({
      id: hermesConversations.id,
      organizationId: hermesConversations.organizationId,
      status: hermesConversations.status,
    })
    .from(hermesConversations)
    .where(eq(hermesConversations.conversationId, conversationId))
    .limit(1);

    if (!conv) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    // 2. Zero-Trust Authorization check
    const collabs = await db.select().from(nexusCollaborators).where(eq(nexusCollaborators.discordUserId, discordUserId)).limit(1);
    if (collabs.length === 0) {
      return NextResponse.json({ error: 'No tienes una cuenta de operador verificada. Usa !link-wallet.' }, { status: 403 });
    }
    const collab = collabs[0];
    if (!collab) {
      return NextResponse.json({ error: 'No tienes una cuenta de operador verificada.' }, { status: 403 });
    }

    const projectLink = await db.select().from(projectCollaborators)
      .where(and(
        eq(projectCollaborators.collaboratorId, collab.id),
        eq(projectCollaborators.projectId, conv.organizationId)
      )).limit(1);

    if (projectLink.length === 0 && collab.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: `No tienes permisos asignados en el Admin para interactuar con este Tenant (${conv.organizationId}).` }, { status: 403 });
    }

    // 3. Insertar mensaje como 'OPERATOR'
    const [lastMsg] = await db.select({ sequence: hermesConversationMessages.sequence })
      .from(hermesConversationMessages)
      .where(eq(hermesConversationMessages.conversationId, conv.id))
      .orderBy(desc(hermesConversationMessages.sequence))
      .limit(1);
    const sequence = (lastMsg?.sequence || 0) + 1;

    await db.insert(hermesConversationMessages).values({
      id: uuidv4(),
      organizationId: conv.organizationId,
      conversationId: conv.id,
      role: 'OPERATOR',
      content: message,
      sequence,
      idempotencyKey: uuidv4(),
    });

    // 4. Obtener configuración del tenant para enviar al canal
    const [project] = await db.select({
      tenantRuntimeConfig: projects.tenantRuntimeConfig
    }).from(projects).where(eq(projects.slug, conv.organizationId)).limit(1);

    const config = (project?.tenantRuntimeConfig as any) || {};
    const tgToken = config.secrets?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;

    // 5. Determinar canal e inyectar mensaje
    let sent = false;
    if (conversationId.startsWith('tg_') || /^\d+$/.test(conversationId)) {
      // Telegram
      const chatId = conversationId.replace('tg_', '');
      if (tgToken) {
        const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
          }),
        });
        sent = res.ok;
      }
    } else if (conversationId.startsWith('wa_') || /^\+?\d{10,15}$/.test(conversationId)) {
      // WhatsApp
      const phone = conversationId.replace('wa_', '');
      const waRes = await sendWhatsAppMessage(phone, message);
      sent = Boolean(waRes.success);
    }

    // 6. Devolver el control a Hermes si se solicitó
    if (releaseTakeover) {
      await db.update(hermesConversations)
        .set({ status: 'ACTIVE', escalationReason: null, updatedAt: new Date() })
        .where(eq(hermesConversations.id, conv.id));
    } else {
      await db.update(hermesConversations)
        .set({ updatedAt: new Date() })
        .where(eq(hermesConversations.id, conv.id));
    }

    return NextResponse.json({ ok: true, sent });

  } catch (error: any) {
    console.error('[Discord HITL Reply] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
