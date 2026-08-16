import { NextResponse } from 'next/server';
import { db } from '@/db';
import { channelIdentityBindings, projects, users, daoMembers, installedProducts } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { WhatsAppAdapter } from '@/lib/pandoras/core/domains/channels/adapters/whatsapp-adapter';
import { TelegramAdapter } from '@/lib/pandoras/core/domains/channels/adapters/telegram-adapter';

// Interfaz para la deduplicación de canales
interface GroupedBindings {
  identityId: string; // Project slug
  email?: string;
  whatsapp?: string; // externalUserId
  telegram?: string; // externalUserId
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeBindings = await db.select().from(channelIdentityBindings).where(
      eq(channelIdentityBindings.status, 'ACTIVE')
    );

    if (activeBindings.length === 0) {
      return NextResponse.json({ success: true, message: 'No active omnichannel bindings found.' });
    }

    // 1. Agrupar por identityId (Deduplicación Omnicanal)
    const grouped = new Map<string, GroupedBindings>();
    for (const binding of activeBindings) {
      const g = grouped.get(binding.identityId) || { identityId: binding.identityId };
      if (binding.channel === 'email') g.email = binding.externalUserId;
      if (binding.channel === 'whatsapp') g.whatsapp = binding.externalUserId;
      if (binding.channel === 'telegram') g.telegram = binding.externalUserId;
      grouped.set(binding.identityId, g);
    }

    const whatsappAdapter = new WhatsAppAdapter();
    const telegramAdapter = new TelegramAdapter();
    let dispatchedCount = 0;

    for (const [identityId, channels] of grouped.entries()) {
      // IdentityId = Project Slug
      const projectList = await db.select().from(projects).where(eq(projects.slug, identityId));
      const project = projectList[0];
      if (!project) continue;

      // Buscar si es un trial
      const productList = await db.select().from(installedProducts).where(
        sql`${installedProducts.projectId} = ${project.id} AND ${installedProducts.product} = 'HERMES'`
      );
      const hermesProduct = productList[0];

      // Determinar si hay un usuario principal (para wallet) 
      const userList = await db.select().from(users).where(
        channels.telegram ? eq(users.telegramId, channels.telegram) : eq(users.id, 'NO_MATCH')
      );
      const user = userList[0];

      const members = await db.select({ count: sql`count(*)` }).from(daoMembers).where(eq(daoMembers.projectId, project.id));
      const memberCount = Number(members[0]?.count || 0);

      const orgClientBindings = await db.select({ count: sql`count(*)` })
        .from(channelIdentityBindings)
        .where(eq(channelIdentityBindings.identityId, project.slug));
      const clientBindingsCount = Number(orgClientBindings[0]?.count || 0);

      let messageContent = null;
      let shouldMarkAsReady = false;

      // Lógica de Vencimiento de Trial
      if (hermesProduct && hermesProduct.status === 'trial' && hermesProduct.trialEndsAt) {
        const now = new Date();
        const endDate = new Date(hermesProduct.trialEndsAt);
        // Si ya expiró
        if (now > endDate) {
          messageContent = `🤖 *Hermes (Finanzas)*\n\nEstimado Gestor, su periodo de prueba de 3 días ha finalizado. Para no interrumpir su servicio operativo, puede solicitar una extensión única de 3 días adicionales. Responda 'Extender' o acceda al portal para realizar el upgrade.`;
        }
      }

      // Lógica Normal (Customer Journey del Gestor)
      if (!messageContent) {
        if (user && (!user.hasPandorasKey || !user.walletAddress)) {
          messageContent = `🤖 *Hermes (Protocolo Operativo)*\n\nEstimado Gestor, nuestro sistema detecta que el despliegue de su Portal está pausado debido a la ausencia de una Llave Criptográfica. Para asegurar la soberanía de su información, por favor conecte su Wallet en el panel principal. ¿Requiere asistencia?`;
        } else if (clientBindingsCount === 0) {
          messageContent = `🤖 *Hermes (Infraestructura de Comunicaciones)*\n\nPara que pueda interactuar con sus clientes de forma omnicanal, es necesario activar sus canales de comunicación. Le sugiero configurar sus puntos de acceso en la consola central.`;
        } else if (memberCount <= 1) {
          messageContent = `🤖 *Hermes (Recursos Humanos)*\n\nLas operaciones exitosas requieren un equipo coordinado. Aún es el único miembro activo en su portal operativo. Le recomiendo invitar a su equipo de trabajo.`;
        } else if (project.status === 'draft') {
          messageContent = `🤖 *Hermes (Operaciones)*\n\nSu portal operativo se encuentra actualmente en modo borrador (Draft). Para lanzar oficialmente sus servicios, es necesario finalizar la configuración básica comercial.`;
        } else if (project.deploymentStatus === 'pending') {
          // TODOS LOS HITOS COMPLETADOS
          messageContent = `🤖 *Hermes (Dirección General)*\n\n¡Felicidades Gestor! He validado que su Wallet, canales de comunicación y equipo están configurados. Su Centro de Comando Operativo está 100% desplegado y listo para dominar el mercado.`;
          shouldMarkAsReady = true;
        }
      }

      if (!messageContent) continue;

      const sendToChannel = async (channelType: 'whatsapp' | 'telegram', externalUserId: string) => {
        try {
          if (channelType === 'whatsapp') {
            await whatsappAdapter.send({
              organizationId: identityId,
              conversationId: `conv_wa_${identityId}_${externalUserId}`,
              content: messageContent,
              message: { messageId: `fw_${Date.now()}`, content: messageContent, externalMessageId: '' }
            } as any);
          } else if (channelType === 'telegram') {
            await telegramAdapter.send({
              organizationId: identityId,
              conversationId: `conv_tg_${identityId}_${externalUserId}`,
              content: messageContent,
              message: { messageId: `fw_${Date.now()}`, content: messageContent, externalMessageId: '' }
            } as any);
          }
          dispatchedCount++;
        } catch (err: any) {
          console.error(`[Hermes Cron] Failed to send to ${channelType} (${externalUserId}):`, err);
        }
      };

      // Jerarquía de envío: WhatsApp > Telegram (Deduplicación Omnicanal)
      if (channels.whatsapp) {
        await sendToChannel('whatsapp', channels.whatsapp);
      } else if (channels.telegram) {
        await sendToChannel('telegram', channels.telegram);
      }

      // Si se completó el Onboarding, lo marcamos activo en DB
      if (shouldMarkAsReady) {
        await db.update(projects).set({ deploymentStatus: 'active' }).where(eq(projects.id, project.id));
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Follow-ups and Trial alerts evaluated successfully',
      dispatchedCount 
    });

  } catch (error: any) {
    console.error('[Hermes Cron Error]:', error);
    return NextResponse.json({ error: 'Internal cron error' }, { status: 500 });
  }
}
