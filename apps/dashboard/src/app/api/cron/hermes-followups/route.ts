import { NextResponse } from 'next/server';
import { db } from '@/db';
import { channelIdentityBindings, projects, users, daoMembers } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { WhatsAppAdapter } from '@/lib/pandoras/core/domains/channels/adapters/whatsapp-adapter';
import { TelegramAdapter } from '@/lib/pandoras/core/domains/channels/adapters/telegram-adapter';

/**
 * Cron Job para evaluar el estado de los portales y despachar mensajes 
 * proactivos a los Gestores vía WhatsApp o Telegram.
 * 
 * Se puede llamar haciendo GET a /api/cron/hermes-followups
 */
export async function GET(request: Request) {
  try {
    // 1. Validar autorización de Vercel Cron (opcional para pruebas)
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obtener los bindings activos de los usuarios (Gestores conectados a Hermes)
    const activeBindings = await db.select().from(channelIdentityBindings).where(
      eq(channelIdentityBindings.status, 'ACTIVE')
    );

    if (activeBindings.length === 0) {
      return NextResponse.json({ success: true, message: 'No active omnichannel bindings found.' });
    }

    const whatsappAdapter = new WhatsAppAdapter();
    const telegramAdapter = new TelegramAdapter();

    let dispatchedCount = 0;

    // 3. Iterar sobre las conexiones de los gestores y evaluar su Journey
    for (const binding of activeBindings) {
      // IdentityId = Project Slug
      const projectList = await db.select().from(projects).where(eq(projects.slug, binding.identityId));
      const project = projectList[0];
      if (!project) continue;

      // Attempt to find the user via telegramId (since WhatsApp might not be directly in users yet)
      const userList = await db.select().from(users).where(
        binding.channel === 'telegram' ? eq(users.telegramId, binding.externalUserId) : eq(users.id, 'NO_MATCH')
      );
      const user = userList[0];

      const members = await db.select({ count: sql`count(*)` }).from(daoMembers).where(eq(daoMembers.projectId, project.id));
      const memberCount = Number(members[0]?.count || 0);

      // Evaluar canales configurados en el proyecto (si tiene identity bindings donde él es la organización)
      // binding.identityId = slug, we look for bindings bound TO this org but for external actors
      const orgClientBindings = await db.select({ count: sql`count(*)` })
        .from(channelIdentityBindings)
        .where(eq(channelIdentityBindings.identityId, project.slug));
      
      const clientBindingsCount = Number(orgClientBindings[0]?.count || 0);

      let messageContent = null;

      if (user && (!user.hasPandorasKey || !user.walletAddress)) {
        // Hito 1: Despliegue de Seguridad (Falta Wallet)
        messageContent = `🤖 *Hermes (Protocolo Operativo)*\n\nEstimado Gestor, nuestro sistema detecta que el despliegue de su Portal está pausado debido a la ausencia de una Llave Criptográfica. Para asegurar la soberanía de su información, por favor conecte su Wallet en el panel principal. ¿Requiere asistencia?`;
      
      } else if (clientBindingsCount === 0) {
        // Hito 2: Configurar canales de comunicación
        messageContent = `🤖 *Hermes (Infraestructura de Comunicaciones)*\n\nPara que pueda interactuar con sus clientes de forma omnicanal, es necesario activar sus canales de comunicación. Le sugiero configurar sus puntos de acceso (WhatsApp, Telegram o Email) en la consola central para que yo pueda comenzar a recibir solicitudes en su nombre.`;
      
      } else if (memberCount <= 1) {
        // Hito 3: Integración de Equipo
        messageContent = `🤖 *Hermes (Recursos Humanos)*\n\nLas operaciones exitosas requieren un equipo coordinado. He notado que aún es el único miembro activo en su portal operativo. Le recomiendo invitar a su equipo de trabajo o socios estratégicos para delegar accesos y optimizar la gestión.`;
      
      } else if (project.status === 'draft') {
        // Hito 4: Proyecto en Draft
        messageContent = `🤖 *Hermes (Operaciones)*\n\nSu portal operativo se encuentra actualmente en modo borrador (Draft). Para lanzar oficialmente sus servicios a sus clientes, es necesario finalizar la configuración básica comercial. Si no está seguro de por dónde continuar, envíeme la palabra 'Guía'.`;
      
      } else {
        // Hito 5: Interacción con clientes (Estrategia Corporativa)
        messageContent = `🤖 *Hermes (Estrategia Corporativa)*\n\nLas empresas líderes mantienen un pulso constante con sus clientes. He notado que no hemos lanzado ninguna iniciativa de retroalimentación o votación recientemente. ¿Desea que redacte una propuesta estratégica para evaluar la satisfacción o decidir el próximo servicio a lanzar?`;
      }

      if (!messageContent) continue;

      try {
        if (binding.channel === 'whatsapp') {
          await whatsappAdapter.send({
            organizationId: binding.identityId,
            conversationId: `conv_wa_${binding.identityId}_${binding.externalUserId}`,
            content: messageContent,
            message: { messageId: `followup_${Date.now()}`, content: messageContent, externalMessageId: '' }
          } as any);
        } else if (binding.channel === 'telegram') {
          await telegramAdapter.send({
            organizationId: binding.identityId,
            conversationId: `conv_tg_${binding.identityId}_${binding.externalUserId}`,
            content: messageContent,
            message: { messageId: `followup_${Date.now()}`, content: messageContent, externalMessageId: '' }
          } as any);
        }
        dispatchedCount++;
      } catch (err: any) {
        console.error(`[Hermes Cron] Failed to send followup to ${binding.channel} (${binding.externalUserId}):`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Follow-ups evaluated and dispatched successfully',
      dispatchedCount 
    });

  } catch (error: any) {
    console.error('[Hermes Cron Error]:', error);
    return NextResponse.json({ error: 'Internal cron error' }, { status: 500 });
  }
}
