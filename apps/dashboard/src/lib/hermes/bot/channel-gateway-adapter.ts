import { 
  HermesTenantMembershipService, 
  AuthorizedTenant
} from '@/lib/hermes/auth';
import { collectSystemStatus, buildStatusMessage } from '@/lib/hermes/bot/system-status';
import { db } from '@/db';
import { hermesJourneys, hermesJourneyStages, hermesAddonInstallations, projects } from '@/db/schema';
import { eq, or, asc } from 'drizzle-orm';
import { CANONICAL_ADDONS, ensureCanonicalAddOnsRegistered } from '@/lib/pandoras/core/domains/hermes/addons/catalog';
import { TenantCreditLedgerService } from '@/lib/hermes/compute/tenant-credit-ledger.service';
import { ChannelContext, ChannelOutboundPayload } from '../channel-gateway';

export function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class ChannelGatewayAdapter {
  private tmaBaseUrl: string;
  private membershipService: HermesTenantMembershipService;

  constructor(options: { tmaBaseUrl?: string } = {}) {
    this.tmaBaseUrl = options.tmaBaseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';
    this.membershipService = new HermesTenantMembershipService();
  }

  async handleInbound(ctx: ChannelContext): Promise<ChannelOutboundPayload> {
    const text = ctx.message.trim() || '';
    const userId = ctx.externalUserId;
    const conversationId = ctx.externalConversationId;
    
    // Command routing based on the message content (which the edge parsed)
    // Edge will send raw text like "/start org_acme" or callback data like "cmd:status"
    
    const isCallback = ctx.metadata?.isCallback === true;
    
    if (isCallback) {
        return this.handleCallbackQuery(ctx, text, userId, conversationId);
    }

    const parts = text.split(/\s+/);
    const command = (parts[0] || '').toLowerCase();
    const arg = parts[1] || '';

    // We can also allow tenant hints from the Edge
    const intentSlug = arg || ctx.tenantHint;

    if (command === '/start') {
      return this.executeStartCommand(ctx, userId, intentSlug);
    }
    if (command === '/portal' || command === '/tma') {
      return this.executePortalCommand(ctx, userId, intentSlug);
    }
    if (command === '/status') {
      return this.executeStatusCommand(ctx, userId);
    }
    if (command === '/help') {
      return this.executeHelpCommand(ctx);
    }
    if (command === '/switch') {
      return this.executeSwitchCommand(ctx, userId);
    }
    if (command === '/journeys') {
      return this.executeJourneysCommand(ctx, userId);
    }
    if (command === '/addons') {
      return this.executeAddonsCommand(ctx, userId);
    }
    if (command === '/recargar' || command === '/credits' || command === '/topup') {
      return this.executeTopupCommand(ctx, userId);
    }

    // Conversational Chat Fallback (Natural Language with Hermes Cognitive Runtime)
    return this.executeConversationalMessage(ctx, userId, text);
  }

  private async handleCallbackQuery(ctx: ChannelContext, data: string, userId: string, conversationId: string): Promise<ChannelOutboundPayload> {
    if (data === 'cmd:status') return this.executeStatusCommand(ctx, userId);
    if (data === 'cmd:switch') return this.executeSwitchCommand(ctx, userId);
    if (data === 'cmd:journeys') return this.executeJourneysCommand(ctx, userId);
    if (data === 'cmd:addons') return this.executeAddonsCommand(ctx, userId);

    if (data.startsWith('switch:')) {
      const targetOrgId = data.replace('switch:', '');
      try {
        const session = await this.membershipService.validateTenantAccess({
          telegramUserId: userId,
          targetOrganizationId: targetOrgId,
          username: ctx.metadata?.username,
        });

        const tmaUrl = `${this.tmaBaseUrl}/tma?tenant=${encodeURIComponent(session.tenant.tenantSlug || session.tenant.organizationId)}`;
        const successText = `✅ <b>Workspace Activo Conmutado:</b>\n` +
          `Organización: <b>${escapeHtml(session.tenant.organizationName)}</b>\n` +
          `Rol: <code>${escapeHtml(session.role)}</code>\n\n` +
          `Tu Command Center ahora opera sobre este workspace.`;

        return {
          channel: ctx.channel,
          externalConversationId: ctx.externalConversationId,
          externalUserId: ctx.externalUserId,
          replyText: successText,
          metadata: {
            inlineKeyboard: [
              [{ text: '🚀 Abrir Command Center (TMA)', web_app: { url: tmaUrl } }],
              [
                { text: '📊 Estado', callback_data: 'cmd:status' },
                { text: '🎯 Journeys', callback_data: 'cmd:journeys' },
                { text: '🧩 Add-Ons', callback_data: 'cmd:addons' }
              ],
              [{ text: '🔄 Cambiar Workspace', callback_data: 'cmd:switch' }]
            ],
            menuButton: { text: '🚀 Command Center', url: tmaUrl }
          }
        };
      } catch (err: any) {
        return {
            channel: ctx.channel,
            externalConversationId: ctx.externalConversationId,
            externalUserId: ctx.externalUserId,
            replyText: `❌ Error al conmutar workspace: ${escapeHtml(err.message)}`
        };
      }
    }

    return {
        channel: ctx.channel,
        externalConversationId: ctx.externalConversationId,
        externalUserId: ctx.externalUserId,
        replyText: "Operación desconocida."
    };
  }

  private async executeHelpCommand(ctx: ChannelContext): Promise<ChannelOutboundPayload> {
    const helpText = `🤖 <b>Hermes OS Command Center</b>\n\n` +
      `<b>Comandos de Operación:</b>\n` +
      `• <code>/start</code> — Menú principal e inicio de sesión en tu Workspace.\n` +
      `• <code>/portal</code> o <code>/tma</code> — Abrir la Mini App de Hermes OS.\n` +
      `• <code>/recargar</code> — Recargar créditos de GPU serverless.\n` +
      `• <code>/status</code> — Diagnóstico de salud (Postgres, IPFS y Bóvedas).\n` +
      `• <code>/journeys</code> — Embudos de conversión, etapas e hitos en vivo.\n` +
      `• <code>/addons</code> — Estrategias y Add-Ons cognitivos activos.\n` +
      `• <code>/switch</code> — Conmutar entre organizaciones autorizadas.\n` +
      `• <code>/help</code> — Guía de comandos.\n\n` +
      `💡 <i>Para vincular tu cuenta a un Workspace, ingresa al Dashboard Web con tu wallet autorizada o agrega tu ID externo.</i>`;

    return {
        channel: ctx.channel,
        externalConversationId: ctx.externalConversationId,
        externalUserId: ctx.externalUserId,
        replyText: helpText
    };
  }

  private async executeStartCommand(ctx: ChannelContext, userId: string, intentSlug?: string): Promise<ChannelOutboundPayload> {
    const tenants = await this.membershipService.getAuthorizedTenants(userId);
    const username = ctx.metadata?.username || 'Operador';

    if (tenants.length === 0) {
      const safeUsername = escapeHtml(username);
      const unauthText = `🏛️ <b>Hermes OS — Command Center</b>\n\n` +
        `Hola @${safeUsername}. Tu cuenta (ID: <code>${escapeHtml(userId)}</code>) no tiene workspaces vinculados en Hermes OS.\n\n` +
        `ℹ️ <i>Para vincular tu cuenta, entra al Dashboard web en tu organización y agrega tu ID de comunicación o conecta tu wallet autorizada.</i>`;
      return {
          channel: ctx.channel,
          externalConversationId: ctx.externalConversationId,
          externalUserId: ctx.externalUserId,
          replyText: unauthText
      };
    }

    let activeTenant = tenants[0]!;
    if (intentSlug) {
      const cleanSlug = intentSlug.replace(/^org_/, '');
      const matched = tenants.find(t => t.tenantSlug?.toLowerCase() === cleanSlug.toLowerCase() || t.organizationId.toLowerCase() === cleanSlug.toLowerCase());
      if (matched) activeTenant = matched;
    }

    const tmaUrl = `${this.tmaBaseUrl}/tma?tenant=${encodeURIComponent(activeTenant.tenantSlug || activeTenant.organizationId)}`;
    const welcomeText = `🏛️ <b>Hermes OS — Command Center</b>\n\n` +
      `Operador: <b>@${escapeHtml(username)}</b>\n` +
      `Workspace Activo: <b>${escapeHtml(activeTenant.organizationName)}</b> (Rol: <code>${escapeHtml(activeTenant.role)}</code>)\n\n` +
      `Selecciona una acción operativa:`;

    const inlineKeyboard: any[][] = [
      [{ text: '🚀 Abrir Command Center', web_app: { url: tmaUrl } }],
      [{ text: '📊 Estado del Sistema', callback_data: 'cmd:status' }]
    ];
    if (tenants.length > 1) {
      inlineKeyboard.push([{ text: `🔄 Cambiar Workspace (${tenants.length} disponibles)`, callback_data: 'cmd:switch' }]);
    }

    return {
        channel: ctx.channel,
        externalConversationId: ctx.externalConversationId,
        externalUserId: ctx.externalUserId,
        replyText: welcomeText,
        metadata: { inlineKeyboard, menuButton: { text: '🚀 Command Center', url: tmaUrl } }
    };
  }

  private async executePortalCommand(ctx: ChannelContext, userId: string, intentSlug?: string): Promise<ChannelOutboundPayload> {
    const tenants = await this.membershipService.getAuthorizedTenants(userId);
    if (tenants.length === 0) {
        return {
            channel: ctx.channel,
            externalConversationId: ctx.externalConversationId,
            externalUserId: ctx.externalUserId,
            replyText: `⚠️ No tienes workspaces autorizados en Hermes OS.`
        };
    }

    let activeTenant = tenants[0]!;
    if (intentSlug) {
      const cleanSlug = intentSlug.replace(/^org_/, '');
      const matched = tenants.find(t => t.tenantSlug?.toLowerCase() === cleanSlug.toLowerCase() || t.organizationId.toLowerCase() === cleanSlug.toLowerCase());
      if (matched) activeTenant = matched;
    }
    const tmaUrl = `${this.tmaBaseUrl}/tma?tenant=${encodeURIComponent(activeTenant.tenantSlug || activeTenant.organizationId)}`;
    const text = `📱 <b>Hermes OS Command Center</b>\nWorkspace: <b>${escapeHtml(activeTenant.organizationName)}</b>`;
    
    return {
        channel: ctx.channel,
        externalConversationId: ctx.externalConversationId,
        externalUserId: ctx.externalUserId,
        replyText: text,
        metadata: {
            inlineKeyboard: [[{ text: '⚡ Entrar al Command Center', web_app: { url: tmaUrl } }]],
            menuButton: { text: '🚀 Command Center', url: tmaUrl }
        }
    };
  }

  private async executeStatusCommand(ctx: ChannelContext, userId: string): Promise<ChannelOutboundPayload> {
    const tenants = await this.membershipService.getAuthorizedTenants(userId);
    if (tenants.length === 0) {
        return {
            channel: ctx.channel,
            externalConversationId: ctx.externalConversationId,
            externalUserId: ctx.externalUserId,
            replyText: `⚠️ No tienes acceso a métricas de estado.`
        };
    }
    const activeTenant = tenants[0]!;
    const status = await collectSystemStatus(activeTenant.organizationId);
    const statusText = buildStatusMessage(status, activeTenant.organizationName, tenants.length);

    return {
        channel: ctx.channel,
        externalConversationId: ctx.externalConversationId,
        externalUserId: ctx.externalUserId,
        replyText: statusText
    };
  }

  private async executeSwitchCommand(ctx: ChannelContext, userId: string): Promise<ChannelOutboundPayload> {
    const tenants = await this.membershipService.getAuthorizedTenants(userId);
    if (tenants.length === 0) {
        return {
            channel: ctx.channel,
            externalConversationId: ctx.externalConversationId,
            externalUserId: ctx.externalUserId,
            replyText: `⚠️ No tienes workspaces para conmutar.`
        };
    }

    const inlineKeyboard = tenants.map(t => [
        { text: `${t.isOwner ? '👑' : '🏢'} ${t.organizationName} (${t.role})`, callback_data: `switch:${t.organizationId}` }
    ]);
    const text = `🔄 <b>Selecciona el Workspace Activo:</b>\nElige una organización para gestionar su Hermes OS:`;

    return {
        channel: ctx.channel,
        externalConversationId: ctx.externalConversationId,
        externalUserId: ctx.externalUserId,
        replyText: text,
        metadata: { inlineKeyboard }
    };
  }

  private async executeJourneysCommand(ctx: ChannelContext, userId: string): Promise<ChannelOutboundPayload> {
    const tenants = await this.membershipService.getAuthorizedTenants(userId);
    if (tenants.length === 0) {
      return {
          channel: ctx.channel,
          externalConversationId: ctx.externalConversationId,
          externalUserId: ctx.externalUserId,
          replyText: `⚠️ No tienes workspaces autorizados en Hermes OS.`
      };
    }

    const activeTenant = tenants[0]!;
    const cleanTenant = (activeTenant.tenantSlug || activeTenant.organizationId).toLowerCase().replace(/^org_/, '');
    const tmaUrl = `${this.tmaBaseUrl}/tma?tenant=${encodeURIComponent(activeTenant.tenantSlug || activeTenant.organizationId)}`;

    try {
      const journeys = await db
        .select()
        .from(hermesJourneys)
        .where(or(eq(hermesJourneys.organizationId, activeTenant.organizationId), eq(hermesJourneys.organizationId, cleanTenant)))
        .orderBy(asc(hermesJourneys.createdAt));

      let msg = `🎯 <b>Journeys & Funnels — ${escapeHtml(activeTenant.organizationName)}</b>\n\n`;

      if (journeys.length === 0) {
        msg += `<i>No hay journeys configurados para este workspace.</i>\n`;
      } else {
        for (const j of journeys) {
          const stages = await db.select().from(hermesJourneyStages).where(eq(hermesJourneyStages.journeyId, j.id)).orderBy(asc(hermesJourneyStages.orderIndex));
          const statusEmoji = j.status === 'ACTIVE' ? '🟢' : '⏸️';
          msg += `${statusEmoji} <b>${escapeHtml(j.name)}</b> (v${j.version || 1})\n`;
          if (j.description) msg += `   <i>${escapeHtml(j.description)}</i>\n`;
          msg += `   <b>Etapas (${stages.length}):</b>\n`;
          for (const s of stages) {
            msg += `   • <code>${s.orderIndex + 1}.</code> ${escapeHtml(s.name)}\n`;
          }
          msg += `\n`;
        }
      }

      return {
          channel: ctx.channel,
          externalConversationId: ctx.externalConversationId,
          externalUserId: ctx.externalUserId,
          replyText: msg,
          metadata: {
              inlineKeyboard: [
                  [{ text: '📱 Administrar Journeys en TMA', web_app: { url: tmaUrl } }],
                  [{ text: '🔄 Actualizar', callback_data: 'cmd:journeys' }]
              ]
          }
      };
    } catch (err: any) {
        return {
            channel: ctx.channel,
            externalConversationId: ctx.externalConversationId,
            externalUserId: ctx.externalUserId,
            replyText: `❌ Error al consultar journeys.`
        };
    }
  }

  private async executeAddonsCommand(ctx: ChannelContext, userId: string): Promise<ChannelOutboundPayload> {
    const tenants = await this.membershipService.getAuthorizedTenants(userId);
    if (tenants.length === 0) {
        return {
            channel: ctx.channel,
            externalConversationId: ctx.externalConversationId,
            externalUserId: ctx.externalUserId,
            replyText: `⚠️ No tienes workspaces autorizados en Hermes OS.`
        };
    }

    const activeTenant = tenants[0]!;
    const cleanTenant = (activeTenant.tenantSlug || activeTenant.organizationId).toLowerCase().replace(/^org_/, '');
    const tmaUrl = `${this.tmaBaseUrl}/tma?tenant=${encodeURIComponent(activeTenant.tenantSlug || activeTenant.organizationId)}`;

    try {
      await ensureCanonicalAddOnsRegistered();
      const installations = await db.select().from(hermesAddonInstallations)
        .where(or(eq(hermesAddonInstallations.organizationId, activeTenant.organizationId), eq(hermesAddonInstallations.organizationId, cleanTenant)));

      const installedSet = new Set(installations.filter(i => i.status === 'ACTIVE').map(i => i.addonId));
      let msg = `🧩 <b>Add-Ons & Estrategias Cognitivas — ${escapeHtml(activeTenant.organizationName)}</b>\n\n`;

      for (const addon of CANONICAL_ADDONS) {
        const isActive = installedSet.has(addon.id);
        const icon = isActive ? '✅' : '⚪';
        const statusText = isActive ? 'ACTIVO' : 'DISPONIBLE';
        msg += `${icon} <b>${escapeHtml(addon.name)}</b> [<code>${statusText}</code>]\n`;
        msg += `   <i>${escapeHtml(addon.description)}</i>\n`;
        msg += `   Tipo: <code>${addon.type}</code> · v${addon.version}\n\n`;
      }

      return {
          channel: ctx.channel,
          externalConversationId: ctx.externalConversationId,
          externalUserId: ctx.externalUserId,
          replyText: msg,
          metadata: {
              inlineKeyboard: [
                  [{ text: '⚡ Activar / Desactivar en TMA', web_app: { url: tmaUrl } }],
                  [{ text: '🔄 Actualizar', callback_data: 'cmd:addons' }]
              ]
          }
      };
    } catch (err: any) {
        return {
            channel: ctx.channel,
            externalConversationId: ctx.externalConversationId,
            externalUserId: ctx.externalUserId,
            replyText: `❌ Error al consultar addons.`
        };
    }
  }

  private async executeTopupCommand(ctx: ChannelContext, userId: string): Promise<ChannelOutboundPayload> {
    const tenants = await this.membershipService.getAuthorizedTenants(userId);
    if (tenants.length === 0) {
        return {
            channel: ctx.channel,
            externalConversationId: ctx.externalConversationId,
            externalUserId: ctx.externalUserId,
            replyText: `⚠️ Tu cuenta no tiene organizaciones vinculadas en Hermes OS. Vincula tu cuenta desde el Dashboard web para recargar créditos.`
        };
    }

    const activeTenant = tenants[0]!;
    const cleanTenant = (activeTenant.tenantSlug || activeTenant.organizationId).toLowerCase().replace(/^org_/, '');
    const credits = await TenantCreditLedgerService.getOrCreateCredits(cleanTenant);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';
    const topupUrl = `${baseUrl}/portal/${cleanTenant}/media?topup=true`;

    const text = `💳 <b>Hermes Billing & Créditos de Cómputo</b>\n` +
      `🏢 Workspace: <b>${escapeHtml(activeTenant.organizationName)}</b> (@${escapeHtml(cleanTenant)})\n\n` +
      `<b>Estado de Créditos:</b>\n` +
      `• Saldo Producción: <code>$${credits.creditBalanceUsd.toFixed(2)} USD</code>\n` +
      `• Saldo Sandbox (Test): <code>$${credits.sandboxBalanceUsd.toFixed(2)} USD</code>\n` +
      `• Margen Aplicado: <code>${credits.markupPercentage}%</code>\n\n` +
      `⚡ <i>Powered by Thirdweb Pay • Acepta Tarjeta (Débito/Crédito) y Cripto (USDC on-chain).\n` +
      `Mínimo de recarga: $5.00 USD con garantía scale-to-zero serverless.</i>`;

    return {
        channel: ctx.channel,
        externalConversationId: ctx.externalConversationId,
        externalUserId: ctx.externalUserId,
        replyText: text,
        metadata: {
            inlineKeyboard: [
                [{ text: '💳 Recargar en Mini App', web_app: { url: topupUrl } }],
                [{ text: '🌐 Recargar en Portal Web', url: topupUrl }],
                [{ text: '📊 Estado del Sistema', callback_data: 'cmd:status' }]
            ]
        }
    };
  }

  private async executeConversationalMessage(ctx: ChannelContext, userId: string, text: string): Promise<ChannelOutboundPayload> {
    const lower = text.toLowerCase();
    if (lower.includes('recargar') || lower.includes('crédito') || lower.includes('credito') || lower.includes('saldo') || lower.includes('topup') || lower.includes('comprar')) {
      return this.executeTopupCommand(ctx, userId);
    }

    const tenants = await this.membershipService.getAuthorizedTenants(userId);
    if (tenants.length === 0) {
      const helpText = `🤖 <b>Hermes OS</b>\n\nHola. Tu cuenta (ID: <code>${escapeHtml(userId)}</code>) no está vinculada a ningún Workspace activo en Hermes OS.\n\nUsa <code>/start</code> para ver opciones o ingresa al Dashboard para vincularla.`;
      return { channel: ctx.channel, externalConversationId: ctx.externalConversationId, externalUserId: ctx.externalUserId, replyText: helpText };
    }

    const activeTenant = tenants[0]!;
    const cleanTenant = (activeTenant.tenantSlug || activeTenant.organizationId).toLowerCase().replace(/^org_/, '');
    const tmaUrl = `${this.tmaBaseUrl}/tma?tenant=${encodeURIComponent(activeTenant.tenantSlug || activeTenant.organizationId)}`;

    try {
      let projectRecord = await db.query.projects.findFirst({
        where: or(eq(projects.slug, cleanTenant), eq(projects.slug, activeTenant.organizationId)),
      });

      if (!projectRecord) {
        const numId = parseInt(activeTenant.organizationId, 10);
        if (!isNaN(numId)) {
          projectRecord = await db.query.projects.findFirst({ where: eq(projects.id, numId) });
        }
      }

      if (projectRecord) {
        const { HermesExecutionEngine } = await import('@/lib/hermes/kernel/execution/execution-api');
        const engine = new HermesExecutionEngine();
        
        // Native Universal Execution Request
        const request = {
            requestId: `req-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            executionId: `${ctx.channel}-${Date.now()}`,
            tenantId: String(projectRecord.id),
            requester: ctx.externalConversationId,
            channel: ctx.channel,
            capability: 'communication.route',
            executionProfile: 'interactive' as const,
            identity: { userId },
            priority: 'normal' as const,
            payload: {
                projectId: projectRecord.id,
                chatId: ctx.externalConversationId,
                userMessage: text,
                botToken: process.env.TELEGRAM_BOT_TOKEN || '',
                raw: ctx
            }
        };

        const result = await engine.execute(request);
        
        // Render from standard execution artifacts
        const textArtifact = result.artifacts?.find((a: any) => a.type === 'message');
        const reply = textArtifact ? textArtifact.content : (result as any).reply || '';

        if (reply && reply.trim()) {
            return {
                channel: ctx.channel,
                externalConversationId: ctx.externalConversationId,
                externalUserId: ctx.externalUserId,
                replyText: reply,
                metadata: {
                    inlineKeyboard: [
                        [{ text: '🚀 Abrir Command Center', web_app: { url: tmaUrl } }],
                        [{ text: '📊 Estado', callback_data: 'cmd:status' }]
                    ]
                }
            };
        }
      }

      const fallbackMsg = `🤖 <b>Hermes OS [${escapeHtml(activeTenant.organizationName)}]</b>\n\n` +
        `Recibí tu consulta: <i>"${escapeHtml(text)}"</i>.\n\n` +
        `Puedes consultar el estado con <code>/status</code>, gestionar embudos con <code>/journeys</code> o abrir la Mini App para interactuar con tus agentes.`;

      return {
          channel: ctx.channel,
          externalConversationId: ctx.externalConversationId,
          externalUserId: ctx.externalUserId,
          replyText: fallbackMsg,
          metadata: {
              inlineKeyboard: [
                  [{ text: '🚀 Abrir Command Center (TMA)', web_app: { url: tmaUrl } }],
                  [{ text: '📊 Estado del Sistema', callback_data: 'cmd:status' }],
                  [{ text: '🎯 Journeys', callback_data: 'cmd:journeys' }]
              ]
          }
      };
    } catch (err: any) {
        return {
            channel: ctx.channel,
            externalConversationId: ctx.externalConversationId,
            externalUserId: ctx.externalUserId,
            replyText: `⚠️ Ocurrió un error al procesar tu mensaje con Hermes OS.`
        };
    }
  }
}
